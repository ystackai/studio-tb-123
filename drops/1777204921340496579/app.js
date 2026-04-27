(function () {
  'use strict';

  // ─── Audio Context ───
  var ctx = null;
  var masterGain = null;
  var lfo = null;
  var lfoGain = null;
  var lfoActive = false;

  // ─── Sequencer State ───
  var STEPS = 16;
  var tempo = 120;
  var playing = false;
  var currentStep = -1;
  var nextStepTime = 0;
  var schedulerTimer = null;
  var scheduleAheadTime = 0.1;
  var lookahead = 25;

  // Step grids: [track][step] = boolean
  var drumGrid = {
    kick:  new Array(STEPS).fill(false),
    snare: new Array(STEPS).fill(false),
    hihat: new Array(STEPS).fill(false)
  };

  // Synth notes: [noteIndex][step] = boolean
  var synthNotes = [
    'C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2', 'C3'
  ];
  var noteToFreq = {
    'C2': 65.41, 'D2': 73.42, 'E2': 82.41, 'F2': 87.31,
    'G2': 98.00, 'A2': 110.00, 'B2': 123.47, 'C3': 130.81
  };
  var synthGrid = {};
  synthNotes.forEach(function (n) {
    synthGrid[n] = new Array(STEPS).fill(false);
  });

  // ─── Synth Params (live) ───
  var synthParams = {
    waveform: 'saw',
    cutoff: 2000,
    res: 1,
    attack: 0.005,
    decay: 0.2,
    sustain: 0.6,
    release: 0.2
  };

  // ─── Drum Params (live) ───
  var drumParams = {
    kickDecay: 0.2,
    snareDecay: 0.15,
    hhOpen: 0.08
  };

  // ─── Init Audio ───
  function initAudio() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.7;
    masterGain.connect(ctx.destination);

    // LFO for "breathing" effect
    lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.15; // slow modulation
    lfoGain = ctx.createGain();
    lfoGain.gain.value = 0; // disabled by default, enabled via modulation
    lfo.connect(lfoGain);
    lfo.start();
  }

  // Resume context on user gesture
  function resumeAudio() {
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  // ─── 808-style Kick ───
  function playKick(time) {
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(30, time + drumParams.kickDecay * 0.5);

    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + drumParams.kickDecay);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(time);
    osc.stop(time + drumParams.kickDecay + 0.01);
  }

  // ─── 808-style Snare ───
  function playSnare(time) {
    // Noise component
    var bufferSize = ctx.sampleRate * drumParams.snareDecay;
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }

    var noise = ctx.createBufferSource();
    noise.buffer = buffer;

    var noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;

    var noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + drumParams.snareDecay * 0.7);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noise.start(time);
    noise.stop(time + drumParams.snareDecay + 0.01);

    // Tone component
    var osc = ctx.createOscillator();
    var oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.05);

    oscGain.gain.setValueAtTime(0.6, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + drumParams.snareDecay * 0.4);

    osc.connect(oscGain);
    oscGain.connect(masterGain);
    osc.start(time);
    osc.stop(time + drumParams.snareDecay + 0.01);
  }

  // ─── 808-style Hi-Hat ───
  function playHihat(time, open) {
    var decay = open ? drumParams.hhOpen : 0.04;

    var bufferSize = ctx.sampleRate * Math.max(decay, 0.05);
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }

    var noise = ctx.createBufferSource();
    noise.buffer = buffer;

    var hpFilter = ctx.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.value = 7000;

    var bpFilter = ctx.createBiquadFilter();
    bpFilter.type = 'bandpass';
    bpFilter.frequency.value = 10000;
    bpFilter.Q.value = 1.2;

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

    noise.connect(hpFilter);
    hpFilter.connect(bpFilter);
    bpFilter.connect(gain);
    gain.connect(masterGain);

    noise.start(time);
    noise.stop(time + Math.max(decay, 0.05) + 0.01);
  }

  // ─── Monophonic Synth ───
  var activeSynthVoice = null;

  function playSynth(freq, time, duration) {
    // Stop previous voice for monophonic behavior
    if (activeSynthVoice) {
      try {
        // Quick release of current voice
        var relTime = Math.max(0.01, synthParams.release * 0.3);
        activeSynthVoice.envelope.gain.cancelScheduledValues(time);
        activeSynthVoice.envelope.gain.setValueAtTime(activeSynthVoice.envelope.gain.value, time);
        activeSynthVoice.envelope.gain.exponentialRampToValueAtTime(0.001, time + relTime);
        activeSynthVoice.osc.stop(time + relTime + 0.01);
      } catch (e) { /* ignore */ }
      activeSynthVoice = null;
    }

    var osc = ctx.createOscillator();
    osc.type = synthParams.waveform;
    osc.frequency.setValueAtTime(freq, time);

    // LFO modulation on filter cutoff
    var filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(synthParams.cutoff, time);
    filter.Q.setValueAtTime(synthParams.res, time);

    // Connect LFO to filter if active
    if (lfoActive && lfoGain) {
      lfoGain.connect(filter.frequency);
      lfoGain.gain.setValueAtTime(200, time);
    }

    // ADSR envelope
    var envelope = ctx.createGain();
    var a = Math.max(0.001, synthParams.attack);
    var d = Math.max(0.001, synthParams.decay);
    var s = synthParams.sustain;
    var r = Math.max(0.001, synthParams.release);

    envelope.gain.setValueAtTime(0.001, time);
    envelope.gain.linearRampToValueAtTime(0.6, time + a);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.001, 0.6 * s), time + a + d);
    // Sustain holds here
    envelope.gain.setValueAtTime(Math.max(0.001, 0.6 * s), time + a + d + duration - r);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + a + d + duration);

    osc.connect(filter);
    filter.connect(envelope);
    envelope.connect(masterGain);

    osc.start(time);
    osc.stop(time + a + d + duration + 0.01);

    activeSynthVoice = { osc: osc, envelope: envelope, filter: filter };

    // Cleanup reference after note ends
    setTimeout(function () {
      if (activeSynthVoice && activeSynthVoice.osc === osc) {
        activeSynthVoice = null;
      }
    }, (a + d + duration + 0.1) * 1000);
  }

  // ─── Sequencer Scheduler ───
  function secondsPerStep() {
    return 60.0 / tempo / 4; // 16th notes
  }

  function scheduleStep(step, time) {
    // Schedule drum hits
    if (drumGrid.kick[step]) playKick(time);
    if (drumGrid.snare[step]) playSnare(time);
    if (drumGrid.hihat[step]) playHihat(time, false);

    // Schedule synth notes
    var duration = secondsPerStep() * 0.9;
    synthNotes.forEach(function (note) {
      if (synthGrid[note][step]) {
        playSynth(noteToFreq[note], time, duration);
      }
    });

    // Schedule UI update (visual feedback)
    requestAnimationFrame(function () {
      highlightCurrentStep(step);
    });
  }

  function scheduler() {
    while (nextStepTime < ctx.currentTime + scheduleAheadTime) {
      scheduleStep(currentStep, nextStepTime);
      nextStepTime += secondsPerStep();
      currentStep = (currentStep + 1) % STEPS;
    }
    schedulerTimer = setTimeout(scheduler, lookahead);
  }

  function startSequencer() {
    if (playing) return;
    resumeAudio();
    if (!ctx) initAudio();

    playing = true;
    currentStep = 0;
    nextStepTime = ctx.currentTime + 0.05;
    scheduler();

    document.getElementById('btn-play').classList.add('active');
  }

  function stopSequencer() {
    playing = false;
    if (schedulerTimer) {
      clearTimeout(schedulerTimer);
      schedulerTimer = null;
    }
    currentStep = -1;
    clearStepHighlights();

    // Release active synth voice
    if (activeSynthVoice) {
      try {
        activeSynthVoice.envelope.gain.cancelScheduledValues(ctx.currentTime);
        activeSynthVoice.envelope.gain.setValueAtTime(0.001, ctx.currentTime);
        activeSynthVoice.osc.stop(ctx.currentTime + 0.01);
      } catch (e) { /* ignore */ }
      activeSynthVoice = null;
    }

    document.getElementById('btn-play').classList.remove('active');
  }

  // ─── UI: Build Grid ───
  function buildDrumGrid() {
    var tracks = ['kick', 'snare', 'hihat'];
    var labels = document.getElementById('step-labels');

    // Step number labels
    var labelHTML = '<div class="step-label"></div>'; // empty corner
    for (var i = 0; i < STEPS; i++) {
      labelHTML += '<div class="step-label">' + (i + 1) + '</div>';
    }
    labels.innerHTML = labelHTML;

    // Track rows
    tracks.forEach(function (track) {
      var trackEl = document.getElementById('track-' + track);
      var stepsContainer = trackEl.querySelector('.steps');
      var stepsHTML = '';
      for (var s = 0; s < STEPS; s++) {
        stepsHTML += '<div class="step" data-track="' + track + '" data-step="' + s + '"></div>';
      }
      stepsContainer.innerHTML = stepsHTML;

      // Bind clicks
      var stepEls = stepsContainer.querySelectorAll('.step');
      stepEls.forEach(function (el) {
        el.addEventListener('click', function () {
          resumeAudio();
          if (!ctx) initAudio();
          var t = this.getAttribute('data-track');
          var st = parseInt(this.getAttribute('data-step'), 10);
          drumGrid[t][st] = !drumGrid[t][st];
          this.classList.toggle('active', drumGrid[t][st]);

          // Preview sound on activation
          if (drumGrid[t][st]) {
            if (t === 'kick') playKick(ctx.currentTime);
            else if (t === 'snare') playSnare(ctx.currentTime);
            else if (t === 'hihat') playHihat(ctx.currentTime, false);
          }
        });
      });
    });
  }

  function buildSynthGrid() {
    var noteRows = document.querySelectorAll('.note-row');
    noteRows.forEach(function (row) {
      var note = row.getAttribute('data-note');
      var stepsContainer = row.querySelector('.note-steps');
      var stepsHTML = '';
      for (var s = 0; s < STEPS; s++) {
        stepsHTML += '<div class="note-step" data-note="' + note + '" data-step="' + s + '"></div>';
      }
      stepsContainer.innerHTML = stepsHTML;

      var stepEls = stepsContainer.querySelectorAll('.note-step');
      stepEls.forEach(function (el) {
        el.addEventListener('click', function () {
          resumeAudio();
          if (!ctx) initAudio();
          var n = this.getAttribute('data-note');
          var st = parseInt(this.getAttribute('data-step'), 10);
          synthGrid[n][st] = !synthGrid[n][st];
          this.classList.toggle('active', synthGrid[n][st]);

          // Preview note
          if (synthGrid[n][st]) {
            playSynth(noteToFreq[n], ctx.currentTime, 0.15);
          }
        });
      });
    });
  }

  // ─── UI: Step Highlighting ───
  function highlightCurrentStep(step) {
    clearStepHighlights();
    currentStep = step;

    // Highlight drum steps
    var drumSteps = document.querySelectorAll('#sequencer .step[data-step="' + step + '"]');
    drumSteps.forEach(function (el) { el.classList.add('current'); });

    // Highlight synth steps
    var synthSteps = document.querySelectorAll('.note-step[data-step="' + step + '"]');
    synthSteps.forEach(function (el) { el.classList.add('current'); });
  }

  function clearStepHighlights() {
    document.querySelectorAll('.step.current, .note-step.current').forEach(function (el) {
      el.classList.remove('current');
    });
  }

  // ─── UI: Controls ───
  function bindControls() {
    // Transport
    document.getElementById('btn-play').addEventListener('click', function () {
      if (playing) stopSequencer(); else startSequencer();
    });

    document.getElementById('btn-stop').addEventListener('click', stopSequencer);

    document.getElementById('btn-clear').addEventListener('click', function () {
      // Clear all grids
      ['kick', 'snare', 'hihat'].forEach(function (t) {
        drumGrid[t].fill(false);
      });
      Object.keys(synthGrid).forEach(function (n) {
        synthGrid[n].fill(false);
      });

      // Clear UI
      document.querySelectorAll('.step.active, .note-step.active').forEach(function (el) {
        el.classList.remove('active');
      });
    });

    // Tempo
    var tempoInput = document.getElementById('tempo-input');
    tempoInput.addEventListener('input', function () {
      tempo = Math.max(60, Math.min(240, parseInt(this.value, 10) || 120));
    });

    // Synth params
    document.getElementById('osc-waveform').addEventListener('change', function () {
      synthParams.waveform = this.value;
    });

    var cutoffSlider = document.getElementById('filter-cutoff');
    cutoffSlider.addEventListener('input', function () {
      synthParams.cutoff = parseInt(this.value, 10);
      document.getElementById('cutoff-value').textContent = this.value + ' Hz';
    });

    var resSlider = document.getElementById('filter-res');
    resSlider.addEventListener('input', function () {
      synthParams.res = parseFloat(this.value);
      document.getElementById('res-value').textContent = parseFloat(this.value).toFixed(1);
    });

    var attackSlider = document.getElementById('env-attack');
    attackSlider.addEventListener('input', function () {
      synthParams.attack = parseInt(this.value, 10) / 1000;
      document.getElementById('attack-value').textContent = this.value + ' ms';
    });

    var decaySlider = document.getElementById('env-decay');
    decaySlider.addEventListener('input', function () {
      synthParams.decay = parseInt(this.value, 10) / 1000;
      document.getElementById('decay-value').textContent = this.value + ' ms';
    });

    var sustainSlider = document.getElementById('env-sustain');
    sustainSlider.addEventListener('input', function () {
      synthParams.sustain = parseInt(this.value, 10) / 100;
      document.getElementById('sustain-value').textContent = this.value + '%';
    });

    var releaseSlider = document.getElementById('env-release');
    releaseSlider.addEventListener('input', function () {
      synthParams.release = parseInt(this.value, 10) / 1000;
      document.getElementById('release-value').textContent = this.value + ' ms';
    });

    // Drum params
    var kickDecaySlider = document.getElementById('kick-decay');
    kickDecaySlider.addEventListener('input', function () {
      drumParams.kickDecay = parseInt(this.value, 10) / 1000;
      document.getElementById('kick-decay-value').textContent = this.value + ' ms';
    });

    var snareDecaySlider = document.getElementById('snare-decay');
    snareDecaySlider.addEventListener('input', function () {
      drumParams.snareDecay = parseInt(this.value, 10) / 1000;
      document.getElementById('snare-decay-value').textContent = this.value + ' ms';
    });

    var hhOpenSlider = document.getElementById('hh-open');
    hhOpenSlider.addEventListener('input', function () {
      drumParams.hhOpen = parseInt(this.value, 10) / 1000;
      document.getElementById('hh-open-value').textContent = this.value + ' ms';
    });

    // Mode toggle buttons (visual selection only)
    var modeBtns = document.querySelectorAll('.mode-btn');
    modeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        modeBtns.forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
      });
    });

    // Keyboard input
    document.addEventListener('keydown', function (e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

      resumeAudio();
      if (!ctx) initAudio();

      var key = e.key.toLowerCase();
      var now = ctx.currentTime;

      // Drum keys: 1=kick, 2=snare, 3=hihat
      if (key === '1') playKick(now);
      else if (key === '2') playSnare(now);
      else if (key === '3') playHihat(now, false);
      // Note keys: a-g for C2-B2
      else if (key === 'a') playSynth(65.41, now, 0.15);  // C2
      else if (key === 's') playSynth(73.42, now, 0.15);  // D2
      else if (key === 'd') playSynth(82.41, now, 0.15);  // E2
      else if (key === 'f') playSynth(87.31, now, 0.15);  // F2
      else if (key === 'g') playSynth(98.00, now, 0.15);  // G2
      else if (key === 'h') playSynth(110.00, now, 0.15); // A2
      else if (key === 'j') playSynth(123.47, now, 0.15); // B2
      else if (key === 'k') playSynth(130.81, now, 0.15); // C3
      // Space: play/stop
      else if (key === ' ') {
        e.preventDefault();
        if (playing) stopSequencer(); else startSequencer();
      }
    });
  }

  // ─── Boot ───
  function init() {
    buildDrumGrid();
    buildSynthGrid();
    bindControls();

    // Default pattern for instant gratification
    // Kick on beats 1, 5, 9, 13 (every quarter note)
    drumGrid.kick[0] = true;
    drumGrid.kick[4] = true;
    drumGrid.kick[8] = true;
    drumGrid.kick[12] = true;

    // Snare on beats 5, 13
    drumGrid.snare[4] = true;
    drumGrid.snare[12] = true;

    // Hi-hat on every 16th (closed)
    for (var i = 0; i < 16; i++) {
      drumGrid.hihat[i] = true;
    }

    // Default bass line: C2 on steps 0, 3, 8, 11
    synthGrid['C2'][0] = true;
    synthGrid['C2'][3] = true;
    synthGrid['G2'][8] = true;
    synthGrid['G2'][11] = true;

    // Update UI to reflect default pattern
    document.querySelectorAll('#sequencer .step').forEach(function (el) {
      var track = el.getAttribute('data-track');
      var step = parseInt(el.getAttribute('data-step'), 10);
      if (drumGrid[track][step]) el.classList.add('active');
    });

    document.querySelectorAll('.note-step').forEach(function (el) {
      var note = el.getAttribute('data-note');
      var step = parseInt(el.getAttribute('data-step'), 10);
      if (synthGrid[note][step]) el.classList.add('active');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
