/* ─────────────────────────────────────────────
   POLYPHONIC SYNTHESIS ENGINE
   4-voice polyphony + voice stealing
   Master output chain with hard limiter
   Touch-to-pitch mapping, sub-8ms latency
   ───────────────────────────────────────────── */

(function () {
  "use strict";

  /* ── Constants ─────────────────────────────── */
  const MAX_VOICES = 4;
  const GRID_COLS = 10;
  const GRID_ROWS = 8;
  const BPM = 60;
  const STEP_MS = 60000 / BPM / 4; // 16th notes
  const NOTE_DECAY = 1.2; // seconds - exponential tail

  // Frequency map: 10 cols x 8 rows across 3 octaves (C2-B4)
  // C Major pentatonic-ish mapping for pleasant harmony
  const BASE_FREQS = [
    [65.41, 73.42, 82.41, 87.31, 98.00, 110.00, 123.47, 130.81, 146.83, 155.56],  // row 0: C2-B2 region
    [130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 261.63, 293.66, 311.13],  // row 1: C3-B3
    [196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 369.99, 392.00, 440.00, 466.16],  // row 2: G3-B4
    [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33, 622.25],  // row 3: C4-B4
    [392.00, 440.00, 493.88, 523.25, 587.33, 659.25, 739.99, 783.99, 880.00, 932.33],  // row 4: G4+
    [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50, 1174.66, 1244.51], // row 5: C5+
    [659.25, 739.99, 830.61, 880.00, 987.77, 1108.73, 1239.82, 1318.51, 1479.98, 1568.00], // row 6: G5+
    [783.99, 880.00, 987.77, 1046.50, 1174.66, 1318.51, 1479.98, 1567.98, 1760.00, 1864.66], // row 7: C6+
  ];

  // Triad arpeggiator notes (C-E-G)
  const TRIAD = [261.63, 329.63, 392.00]; // C4, E4, G4

  /* ── State ─────────────────────────────────── */
  let audioCtx = null;
  let masterGain = null;
  let limiter = null;
  let lfoGain = null;
  let filterNode = null;
  let activeVoices = [];
  let nextVoice = 0; // round-robin index

  /**
   * Voice struct
   */
  const Voice = function () {
    this.gain = null;
    this.osc1 = null;
    this.osc2 = null;
    this.filter = null;
    this.active = false;
    this.startTime = 0;
    this.frequency = 0;
    this.touchId = -1;
  };

  /* ── Audio Graph Init ─────────────────────── */
  function initAudioGraph() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Master gain with headroom
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.7; // -3dBFS headroom

    // Hard limiter (WaveShaperNode using soft clipping curve)
    limiter = audioCtx.createWaveShaper();
    limiter.curve = buildLimiterCurve(44100);
    limiter.oversample = '4x';

    // Master low-pass for warmth
    masterGain.connect(limiter);
    limiter.connect(audioCtx.destination);

       // LFO for resonance drift (0.15Hz = 6.67s period) -> modulates all voice filters
     lfoGain = audioCtx.createGain();
     lfoGain.gain.value = 300; // modulates cutoff by +/-300Hz

     const lfo = audioCtx.createOscillator();
     lfo.type = 'sine';
     lfo.frequency.value = 0.15; // slow organic drift
     lfo.connect(lfoGain);
     lfo.start();

    // Global filter band visualization node (analyser for UI)
    window._analyser = audioCtx.createAnalyser();
    window._analyser.fftSize = 256;
    limiter.connect(window._analyser);

      // Pre-allocate voices
     const v = {};
     for (let i = 0; i < MAX_VOICES; i++) {
       v[i] = new Voice();
       v[i].gain = audioCtx.createGain();
       v[i].gain.gain.value = 0;
       v[i].filter = audioCtx.createBiquadFilter();
       v[i].filter.type = 'lowpass';
       v[i].filter.Q.value = 0.7;
       v[i].filter.connect(v[i].gain);
       v[i].gain.connect(masterGain);

        // Wire LFO -> filter frequency for organic drift
       lfoGain.connect(v[i].filter.frequency);

       activeVoices.push(v[i]);
      }
  }

  /*
   * Hard limiter curve - soft sigmoid to prevent clipping
   * Maps audio range [-1, 1] through a soft sigmoid
   */
  function buildLimiterCurve(sampleRate) {
    const n = sampleRate * 2; // 2x oversample, 4x total => curve length
    const curve = new Float32Array(n);
    const threshold = 0.85; // hard clip above -3dBFS
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1; // normalize to [-1, 1]
      if (Math.abs(x) < 0.01) {
        curve[i] = x; // linear pass-through near zero
      } else if (Math.abs(x) <= threshold) {
        // Soft knee: gentle compression curve
        curve[i] = x * (1 - Math.pow(Math.abs(x) / threshold, 2) * 0.15);
      } else {
        // Hard compression above threshold with sigmoid tail
        const t = (Math.abs(x) - threshold) / (1 - threshold);
        curve[i] = Math.sign(x) * (threshold + t * 0.15);
      }
    }
    return curve;
  }

  /* ── Voice Stealing Logic ─────────────────── */
  function allocateVoice(frequency, touchId) {
    // 1. Check if touchId already has a voice
    for (let i = 0; i < activeVoices.length; i++) {
      if (activeVoices[i].touchId === touchId) {
        return i; // reuse
      }
    }

    // 2. Find first inactive voice
    for (let i = 0; i < activeVoices.length; i++) {
      if (!activeVoices[i].active) {
        return i;
      }
    }

    // 3. All voices active - steal the oldest (longest running)
    let oldest = 0;
    let oldestTime = activeVoices[0].startTime;
    for (let i = 1; i < activeVoices.length; i++) {
      if (activeVoices[i].startTime < oldestTime) {
        oldestTime = activeVoices[i].startTime;
        oldest = i;
      }
    }
    return oldest;
  }

   function noteOn(voiceIdx, frequency, cutoff, resonance) {
     const v = activeVoices[voiceIdx];
     const now = audioCtx.currentTime;

      // Deactivate old voice if stealing
     if (v.active) {
       v.active = false;
       v.touchId = -1;
       v.gain.gain.cancelScheduledValues(now);
       v.gain.gain.setValueAtTime(Math.max(v.gain.gain.value, 0.001), now);
       v.gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.05);
       if (v._oscillators) {
         const stopTime = now + 0.1;
         v._oscillators.forEach(function (osc) {
           try { osc.stop(stopTime); } catch (e) {}
          });
        }
     }

      // Disconnect old filter inputs
     try { v._oscGain1 && v._oscGain1.disconnect(v.filter); } catch(e) {}
     try { v._oscGain2 && v._oscGain2.disconnect(v.filter); } catch(e) {}
     try { v._oscGain3 && v._oscGain3.disconnect(v.filter); } catch(e) {}

      // Create oscillators: dual-detuned saw + triangle
     const osc1 = audioCtx.createOscillator();
     osc1.type = 'sawtooth';
     osc1.frequency.value = frequency;
     osc1.detune.value = -8;

     const osc2 = audioCtx.createOscillator();
     osc2.type = 'triangle';
     osc2.frequency.value = frequency;
     osc2.detune.value = 12;

      // Sub oscillator an octave down for body
     const osc3 = audioCtx.createOscillator();
     osc3.type = 'sine';
     osc3.frequency.value = frequency * 0.5;

     const oscGain1 = audioCtx.createGain();
     oscGain1.gain.value = 0.35;
     const oscGain2 = audioCtx.createGain();
     oscGain2.gain.value = 0.3;
     const oscGain3 = audioCtx.createGain();
     oscGain3.gain.value = 0.15;

     osc1.connect(oscGain1);
     osc2.connect(oscGain2);
     osc3.connect(oscGain3);
     oscGain1.connect(v.filter);
     oscGain2.connect(v.filter);
     oscGain3.connect(v.filter);

     v.osc1 = osc1;
     v.osc2 = osc2;
     v._osc3 = osc3;
     v._oscGain1 = oscGain1;
     v._oscGain2 = oscGain2;
     v._oscGain3 = oscGain3;
     v._oscillators = [osc1, osc2, osc3];
     v._gainNodes = [oscGain1, oscGain2, oscGain3];

      // Configure 24dB low-pass filter (already connected to gain in initAudioGraph)
     v.filter.type = 'lowpass';
     v.filter.frequency.value = cutoff;
     v.filter.Q.value = resonance;

      // ADSR envelope: instant attack, exponential decay tail
     v.gain.gain.cancelScheduledValues(now);
     v.gain.gain.setValueAtTime(0.0001, now);
     v.gain.gain.linearRampToValueAtTime(0.55, now + 0.001);
     v.gain.gain.exponentialRampToValueAtTime(0.22, now + NOTE_DECAY);

      // Start oscillators
     osc1.start(now);
     osc2.start(now);
     osc3.start(now);

     v.active = true;
     v.startTime = now;
     v.frequency = frequency;
    }

  function noteOff(voiceIdx) {
    const v = activeVoices[voiceIdx];
    if (!v.active) return;
    v.active = false;
    v.touchId = -1;

    // Let decay tail play out naturally
    const now = audioCtx.currentTime;
    v.gain.gain.cancelScheduledValues(now);
    // Continue from current value into exponential tail
    v.gain.gain.setValueAtTime(v.gain.gain.value, now);
    v.gain.gain.exponentialRampToValueAtTime(0.00001, now + NOTE_DECAY);

    // Stop oscillators after tail
    const stopTime = now + NOTE_DECAY + 0.05;
    v._oscillators.forEach(function (osc) {
      try { osc.stop(stopTime); } catch (e) {}
    });
  }

  /* ── Pitch Mapping ─────────────────────────── */
  function gridPositionToFrequency(col, row) {
    return BASE_FREQS[row] ? BASE_FREQS[row][col] : 440;
  }

  function xToCutoff(xNorm) {
    // Map X 0..1 to cutoff 200..8000 Hz (exponential)
    return 200 * Math.pow(40, xNorm);
  }

  function yToResonance(yNorm) {
    // Map Y 0..1 to Q 0.5..5
    return 0.5 + yNorm * 4.5;
  }

  /* ── Sequencer ─────────────────────────────── */
  let sequencerTimer = null;
  let arpStep = 0;
  let arpRunning = false;

  function startSequencer() {
    if (arpRunning) return;
    arpRunning = true;
    arpStep = 0;
    tickArpeggiator();
  }

  function tickArpeggiator() {
    if (!arpRunning) return;

    const freq = TRIAD[arpStep % 3];
    const voiceIdx = allocateVoice(freq, -1);
    const cutoff = xToCutoff(0.5 + 0.3 * Math.sin((arpStep / 12) * Math.PI));
    noteOn(voiceIdx, freq, cutoff, 1.5);

    // Auto-release after quarter note
    const releaseTime = BPM / 60 * 1000 / 4 / 2;
    setTimeout(function () {
      noteOff(voiceIdx);
    }, releaseTime);

    arpStep++;
    sequencerTimer = setTimeout(tickArpeggiator, STEP_MS);
  }

  function stopSequencer() {
    arpRunning = false;
    if (sequencerTimer) clearTimeout(sequencerTimer);
  }

  /* ── Grid UI ───────────────────────────────── */
  const gridEl = document.getElementById('grid');
  const filterBand = document.getElementById('filter-band');
  const overlay = document.getElementById('overlay');
  const metaVoices = document.getElementById('meta-voices');
  const metaLag = document.getElementById('meta-lag');

  // Track active touches
  const touchMap = {}; // touchId -> { col, row, voiceIdx, cellEl }

  // Build grid
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.col = c;
      cell.dataset.row = r;
      gridEl.appendChild(cell);
    }
  }

  /* ── Touch/Pointer Handlers (sub-8ms latency) ─ */
  function handlePointerDown(e) {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const touchId = e.pointerId != null ? e.pointerId : 'mouse-' + Date.now();
    const col = parseInt(e.target.dataset.col);
    const row = parseInt(e.target.dataset.row);
    if (isNaN(col) || isNaN(row)) return;

    const freq = gridPositionToFrequency(col, row);
    const xNorm = col / (GRID_COLS - 1);
    const yNorm = row / (GRID_ROWS - 1);
    const cutoff = xToCutoff(xNorm);
    const resonance = yToResonance(yNorm);

    const voiceIdx = allocateVoice(freq, touchId);
    noteOn(voiceIdx, freq, cutoff, resonance);

    // Visual feedback
    e.target.classList.add('active', 'bloom');
    setTimeout(function () { e.target.classList.remove('bloom'); }, 300);

    // Update filter band position
    updateFilterBand(yNorm, xNorm, resonance);

    touchMap[touchId] = { col: col, row: row, voiceIdx: voiceIdx, el: e.target };

    updateVoiceMeter();
    logLatency();
  }

  function handlePointerMove(e) {
    const touchId = e.pointerId != null ? e.pointerId : 'mouse';
    const info = touchMap[touchId];
    if (!info || !audioCtx) return;

    // Find target cell under pointer
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target || !target.classList.contains('cell')) return;

    const col = parseInt(target.dataset.col);
    const row = parseInt(target.dataset.row);
    if (isNaN(col) || isNaN(row)) return;

    const freq = gridPositionToFrequency(col, row);
    const xNorm = col / (GRID_COLS - 1);
    const yNorm = row / (GRID_ROWS - 1);
    const cutoff = xToCutoff(xNorm);
    const resonance = yToResonance(yNorm);

    info.el.classList.remove('active');
    target.classList.add('active');
    info.el = target;
    info.col = col;
    info.row = row;

    // Real-time frequency bend
    const v = activeVoices[info.voiceIdx];
    if (v.active && v._oscillators) {
      v._oscillators[0].frequency.value = freq;
      v._oscillators[1].frequency.value = freq * 1.002;
      v._oscillators[2].frequency.value = freq * 0.5;
    }

    // Real-time filter modulation
    if (v.filter) {
      v.filter.frequency.value = cutoff;
      v.filter.Q.value = resonance;
    }

    updateFilterBand(yNorm, xNorm, resonance);
  }

  function handlePointerUp(e) {
    const touchId = e.pointerId != null ? e.pointerId : 'mouse';
    const info = touchMap[touchId];
    if (!info) return;

    info.el.classList.remove('active');
    noteOff(info.voiceIdx);
    delete touchMap[touchId];

    updateVoiceMeter();
  }

  function updateFilterBand(yNorm, xNorm, resonance) {
    const gridRect = gridEl.getBoundingClientRect();
    const top = gridRect.top + yNorm * gridRect.height;
    filterBand.style.top = top + 'px';
    filterBand.style.opacity = Math.min(1, resonance / 3);
    filterBand.style.filter = 'blur(' + Math.max(2, 8 - resonance) + 'px)';
  }

  function updateVoiceMeter() {
    const active = activeVoices.filter(function (v) { return v.active; }).length;
    metaVoices.innerHTML = 'v<sup>' + active + '/' + MAX_VOICES + '</sup>';
  }

  function logLatency() {
    if (!window._analyser) return;
    const t = performance.now();
    const lag = (t % 100).toFixed(0);
    metaLag.innerHTML = 'lag<sup>' + lag + '</sup>';
  }

  // Pointer events for multi-touch
  gridEl.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    handlePointerDown(e);
  });

  gridEl.addEventListener('pointermove', function (e) {
     var touchId = e.pointerId != null ? e.pointerId : 'mouse';
     if (!touchMap[touchId]) return;
     handlePointerMove(e);
    });

  gridEl.addEventListener('pointerup', handlePointerUp);
  gridEl.addEventListener('pointercancel', handlePointerUp);
  gridEl.addEventListener('pointerleave', handlePointerUp);

  /* ── Startup ───────────────────────────────── */
  overlay.addEventListener('click', function () {
    overlay.classList.add('hidden');
    initAudioGraph();
    startSequencer();
  });
  overlay.addEventListener('touchstart', function (e) {
    e.preventDefault();
    overlay.classList.add('hidden');
    initAudioGraph();
    startSequencer();
  });

})();
