(function () {
  'use strict';

  /* ── Audio Context & State ── */
  let audioCtx = null;
  let masterGain = null;

  var state = {
    playing: false,
    recording: false,
    currentStep: -1,
    bpm: 120,
    mode: 'drum', // or 'synth'
    waveform: 'saw',
    // Synth params
    cutoff: 2000,
    resonance: 1,
    attack: 0.01,
    decay: 0.3,
    // Drum params
    kickDecay: 0.3,
    snareDecay: 0.15,
    // 4 channels x 16 steps: [kick, snare, hihat, synth]
    grid: Array.from({ length: 4 }, function () {
      return new Array(16).fill(false);
    }),
  };

  // Default kick pattern
  state.grid[0][0] = true;
  state.grid[0][4] = true;
  state.grid[0][8] = true;
  state.grid[0][12] = true;
  // Default snare pattern
  state.grid[1][4] = true;
  state.grid[1][12] = true;
  // Default hi-hat pattern
  for (var i = 0; i < 16; i++) {
    state.grid[2][i] = true;
  }
  // Default synth pattern - bass line
  state.grid[3][0] = true;
  state.grid[3][3] = true;
  state.grid[3][6] = true;
  state.grid[3][10] = true;
  state.grid[3][12] = true;

  /* ── Sequencer Scheduler ── */
  var timerID = null;
  var nextStepTime = 0;
  var currentStepAudio = 0;
  var scheduleAheadTime = 0.1;
  var lookahead = 25; // ms

  function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.7;
    masterGain.connect(audioCtx.destination);
  }

  function getSixteenthDuration() {
    return 60.0 / state.bpm / 4;
  }

  // LFO node for "breathing"
  var lfo = null;
  var lfoGain = null;

  function startLFO() {
    if (lfo) return;
    lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08; // ~5 second cycle for slow breathing
    lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 400; // Hz of modulation depth
    lfo.connect(lfoGain);
    lfo.start();
  }

  function stopLFO() {
    if (lfo) {
      try { lfo.stop(); } catch(e){}
      try { lfo.disconnect(); } catch(e){}
      lfo = null;
      lfoGain = null;
    }
  }

  /* ── Drum Synthesis ── */

  function playKick(time, decay) {
    var osc = audioCtx.createOscillator();
    var env = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.08);
    env.gain.setValueAtTime(1, time);
    env.gain.exponentialRampToValueAtTime(0.001, time + (decay || state.kickDecay));
    osc.connect(env);
    env.connect(masterGain);
    osc.start(time);
    osc.stop(time + (decay || state.kickDecay) + 0.05);
  }

  function playSnare(time, decay) {
    // Noise component
    var noiseLen = audioCtx.sampleRate * (decay || state.snareDecay);
    var noiseBuffer = audioCtx.createBuffer(1, noiseLen, audioCtx.sampleRate);
    var data = noiseBuffer.getChannelData(0);
    for (var i = 0; i < noiseLen; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    var noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    var noiseEnv = audioCtx.createGain();
    noiseEnv.gain.setValueAtTime(0.6, time);
    noiseEnv.gain.exponentialRampToValueAtTime(0.001, time + (decay || state.snareDecay));
    var noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseEnv);
    noiseEnv.connect(masterGain);
    noise.start(time);
    noise.stop(time + (decay || state.snareDecay) + 0.01);

    // Tone component
    var osc = audioCtx.createOscillator();
    var toneEnv = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 180;
    toneEnv.gain.setValueAtTime(0.5, time);
    toneEnv.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    osc.connect(toneEnv);
    toneEnv.connect(masterGain);
    osc.start(time);
    osc.stop(time + 0.15);
  }

  function playHiHat(time) {
    var noiseLen = audioCtx.sampleRate * 0.08;
    var noiseBuffer = audioCtx.createBuffer(1, noiseLen, audioCtx.sampleRate);
    var data = noiseBuffer.getChannelData(0);
    for (var i = 0; i < noiseLen; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    var noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    var env = audioCtx.createGain();
    env.gain.setValueAtTime(0.35, time);
    env.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    var filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;
    noise.connect(filter);
    filter.connect(env);
    env.connect(masterGain);
    noise.start(time);
    noise.stop(time + 0.1);
  }

  /* ── Synth Engine (Monophonic Subtractive) ── */

  // Note frequencies for bass line across 16 steps
  var noteFrequencies = [
    55.00,  // A1, step 0
    55.00,
    55.00,  // step 2
    65.41,  // C2, step 3
    65.41,
    65.41,
    73.42,  // D2, step 6
    73.42,
    55.00,  // A1, step 8
    55.00,
    82.41,  // E2, step 10
    73.42,  // D2, step 11
    65.41,  // C2, step 12
    55.00,  // A1, step 13
    55.00,
    55.00,
  ];

  var activeSynthOsc = null;
  var activeSynthFilter = null;
  var activeSynthEnv = null;
  var synthNoteTimeout = null;

  function stopSynthNote() {
    if (activeSynthOsc) {
      var now = audioCtx.currentTime;
      try {
        activeSynthEnv.gain.cancelScheduledValues(now);
        activeSynthEnv.gain.setValueAtTime(activeSynthEnv.gain.value, now);
        activeSynthEnv.gain.linearRampToValueAtTime(0, now + 0.05);
        activeSynthOsc.stop(now + 0.07);
      } catch(e) {}
      try { activeSynthOsc.disconnect(); } catch(e) {}
      try { activeSynthFilter.disconnect(); } catch(e) {}
      try { activeSynthEnv.disconnect(); } catch(e) {}
      activeSynthOsc = null;
      activeSynthFilter = null;
      activeSynthEnv = null;
    }
    if (synthNoteTimeout) {
      clearTimeout(synthNoteTimeout);
      synthNoteTimeout = null;
    }
  }

  function playSynth(time, stepIdx) {
    stopSynthNote();

    var freq = noteFrequencies[stepIdx % 16] || 55;
    var osc = audioCtx.createOscillator();
    var filter = audioCtx.createBiquadFilter();
    var env = audioCtx.createGain();

    osc.type = state.waveform;
    osc.frequency.value = freq;

    filter.type = 'lowpass';
    filter.Q.value = state.resonance;
    var baseCutoff = state.cutoff;
    filter.frequency.setValueAtTime(baseCutoff + 200, time);
    filter.frequency.exponentialRampToValueAtTime(Math.max(baseCutoff - 300, 20), time + state.decay);

    // Connect LFO breathing if running
    if (lfoGain) {
      lfoGain.disconnect();
      lfoGain.connect(filter.frequency);
    }

    // ADSR envelope
    env.gain.setValueAtTime(0.001, time);
    env.gain.linearRampToValueAtTime(0.6, time + Math.max(state.attack, 0.005));
    env.gain.exponentialRampToValueAtTime(0.001, time + state.attack + state.decay);

    osc.connect(filter);
    filter.connect(env);
    env.connect(masterGain);

    osc.start(time);
    var noteDur = state.attack + state.decay + 0.05;
    osc.stop(time + noteDur);

    activeSynthOsc = osc;
    activeSynthFilter = filter;
    activeSynthEnv = env;

    synthNoteTimeout = setTimeout(function () {
      try { stopSynthNote(); } catch(e) {}
    }, noteDur * 1500);
  }

  /* ── Scheduler ── */

  function scheduleStep(step, time) {
    // Kick
    if (state.grid[0][step]) {
      playKick(time);
    }
    // Snare
    if (state.grid[1][step]) {
      playSnare(time);
    }
    // Hi-hat
    if (state.grid[2][step]) {
      playHiHat(time);
    }
    // Synth
    if (state.grid[3][step]) {
      playSynth(time, step);
    }

    // Visual feedback - schedule UI update via requestAnimationFrame
    setTimeout(function () {
      updatePlayhead(step);
    }, Math.max(0, (time - audioCtx.currentTime) * 1000));
  }

  function scheduler() {
    while (nextStepTime < audioCtx.currentTime + scheduleAheadTime) {
      scheduleStep(currentStepAudio, nextStepTime);
      nextStepTime += getSixteenthDuration();
      currentStepAudio = (currentStepAudio + 1) % 16;
    }
    if (state.playing) {
      timerID = setTimeout(scheduler, lookahead);
    }
  }

  function startSequencer() {
    if (state.playing) return;
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    state.playing = true;
    currentStepAudio = 0;
    nextStepTime = audioCtx.currentTime;
    startLFO();
    scheduler();
    document.getElementById('btn-play').classList.add('active');
  }

  function stopSequencer() {
    state.playing = false;
    if (timerID) {
      clearTimeout(timerID);
      timerID = null;
    }
    stopLFO();
    stopSynthNote();
    currentStep = -1;
    currentStepAudio = 0;
    clearPlayheadVisuals();
    document.getElementById('btn-play').classList.remove('active');
  }

  function togglePlay() {
    if (state.playing) {
      stopSequencer();
    } else {
      startSequencer();
    }
  }

  /* ── Recording ── */

  var recordedGrid = null;
  var recordStartStep = 0;

  function toggleRecord() {
    state.recording = !state.recording;
    var btn = document.getElementById('btn-record');
    if (state.recording) {
      btn.classList.add('active');
      // Copy current grid as the starting point
      recordedGrid = state.grid.map(function (row) { return row.slice(); });
    } else {
      btn.classList.remove('active');
      // Apply recorded pattern
      if (recordedGrid) {
        state.grid = recordedGrid;
        redrawGrid();
        recordedGrid = null;
      }
    }
  }

  /* ── UI: Grid Rendering ── */

  function buildGrid() {
    var cells = document.querySelectorAll('.cells');
    cells.forEach(function (rowEl) {
      var rowIdx = parseInt(rowEl.getAttribute('data-row'));
      rowEl.innerHTML = '';
      for (var s = 0; s < 16; s++) {
        var cell = document.createElement('div');
        cell.className = 'cell' + (state.grid[rowIdx][s] ? ' on' : '');
        cell.setAttribute('data-row', rowIdx);
        cell.setAttribute('data-step', s);
        // Mark every 4th step for beat reference
        if (s % 4 === 0) {
          cell.classList.add('cell-lead');
        }
        rowEl.appendChild(cell);
      }
    });
  }

  function redrawGrid() {
    var cells = document.querySelectorAll('.cell');
    cells.forEach(function (cell) {
      var r = parseInt(cell.getAttribute('data-row'));
      var s = parseInt(cell.getAttribute('data-step'));
      cell.classList.toggle('on', !!state.grid[r][s]);
    });
  }

  function toggleCell(row, step) {
    initAudio();
    state.grid[row][step] = !state.grid[row][step];
    if (recordedGrid) {
      recordedGrid[row][step] = state.grid[row][step];
    }
    // Instant preview
    if (state.grid[row][step]) {
      triggerSound(row, step);
    }
    redrawGrid();
  }

  function triggerSound(row, step) {
    if (!audioCtx) return;
    var now = audioCtx.currentTime;
    switch (row) {
      case 0: playKick(now); break;
      case 1: playSnare(now); break;
      case 2: playHiHat(now); break;
      case 3: playSynth(now, step); break;
    }
  }

  /* ── UI: Playhead ── */

  function updatePlayhead(step) {
    state.currentStep = step;
    var cells = document.querySelectorAll('.cell');
    cells.forEach(function (cell) {
      var s = parseInt(cell.getAttribute('data-step'));
      cell.classList.toggle('playing', s === step);
    });
  }

  function clearPlayheadVisuals() {
    var cells = document.querySelectorAll('.cell.playing');
    cells.forEach(function (cell) {
      cell.classList.remove('playing');
    });
    state.currentStep = -1;
  }

  /* ── UI: Controls Wiring ── */

  // BPM
  var bpmSlider = document.getElementById('bpm-slider');
  var bpmDisplay = document.getElementById('bpm-display');
  bpmSlider.addEventListener('input', function () {
    state.bpm = parseInt(this.value);
    bpmDisplay.textContent = state.bpm;
  });

  // Mode toggle
  var modeDrum = document.getElementById('mode-drum');
  var modeSynth = document.getElementById('mode-synth');
  modeDrum.addEventListener('click', function () {
    state.mode = 'drum';
    modeDrum.classList.add('active');
    modeSynth.classList.remove('active');
    document.getElementById('drum-controls').classList.remove('hidden');
    document.getElementById('synth-controls').classList.add('hidden');
  });
  modeSynth.addEventListener('click', function () {
    state.mode = 'synth';
    modeSynth.classList.add('active');
    modeDrum.classList.remove('active');
    document.getElementById('synth-controls').classList.remove('hidden');
    document.getElementById('drum-controls').classList.add('hidden');
  });

  // Waveform selector
  document.querySelectorAll('.wave-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.wave-btn').forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
      state.waveform = this.getAttribute('data-wave');
    });
  });

  // Cutoff
  var ctrlCutoff = document.getElementById('ctrl-cutoff');
  var valCutoff = document.getElementById('val-cutoff');
  ctrlCutoff.addEventListener('input', function () {
    state.cutoff = parseFloat(this.value);
    valCutoff.textContent = state.cutoff + ' Hz';
  });

  // Resonance
  var ctrlRes = document.getElementById('ctrl-res');
  var valRes = document.getElementById('val-res');
  ctrlRes.addEventListener('input', function () {
    state.resonance = parseFloat(this.value);
    valRes.textContent = parseFloat(state.resonance).toFixed(1);
  });

  // Attack
  var ctrlAttack = document.getElementById('ctrl-attack');
  var valAtk = document.getElementById('val-atk');
  ctrlAttack.addEventListener('input', function () {
    state.attack = parseFloat(this.value);
    valAtk.textContent = state.attack.toFixed(2) + 's';
  });

  // Decay
  var ctrlDecay = document.getElementById('ctrl-decay');
  var valDec = document.getElementById('val-dec');
  ctrlDecay.addEventListener('input', function () {
    state.decay = parseFloat(this.value);
    valDec.textContent = state.decay.toFixed(2) + 's';
  });

  // Kick decay
  var ctrlKickDecay = document.getElementById('ctrl-kick-decay');
  var valKickDec = document.getElementById('val-kick-dec');
  ctrlKickDecay.addEventListener('input', function () {
    state.kickDecay = parseFloat(this.value);
    valKickDec.textContent = state.kickDecay.toFixed(2) + 's';
  });

  // Snare decay
  var ctrlSnareDecay = document.getElementById('ctrl-snare-decay');
  var valSnareDec = document.getElementById('val-snare-dec');
  ctrlSnareDecay.addEventListener('input', function () {
    state.snareDecay = parseFloat(this.value);
    valSnareDec.textContent = state.snareDecay.toFixed(2) + 's';
  });

  /* ── Grid Click Handling (delegation) ── */

  document.getElementById('grid').addEventListener('click', function (e) {
    var cell = e.target.closest('.cell');
    if (!cell) return;
    var row = parseInt(cell.getAttribute('data-row'));
    var step = parseInt(cell.getAttribute('data-step'));
    toggleCell(row, step);
  });

  /* ── Transport Buttons ── */

  document.getElementById('btn-play').addEventListener('click', togglePlay);
  document.getElementById('btn-stop').addEventListener('click', function () {
    if (state.playing) stopSequencer();
  });
  document.getElementById('btn-record').addEventListener('click', toggleRecord);

  /* ── Keyboard Input ── */

  var keyMap = {
    '1': function () { initAudio(); if (state.grid[0][0]) playKick(audioCtx.currentTime); highlightRow(0); },
    '2': function () { initAudio(); if (state.grid[1][0]) playSnare(audioCtx.currentTime); highlightRow(1); },
    '3': function () { initAudio(); playHiHat(audioCtx.currentTime); highlightRow(2); },
    '4': function () { initAudio(); playSynth(audioCtx.currentTime, 0); highlightRow(3); },
  };

  function highlightRow(row) {
    var cells = document.querySelectorAll('.cells[data-row="' + row + '"] .cell');
    cells.forEach(function (c) {
      c.classList.add('playing');
      setTimeout(function () { c.classList.remove('playing'); }, 150);
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT') return;
    var k = e.key.toLowerCase();
    if (keyMap[k]) {
      e.preventDefault();
      keyMap[k]();
      return;
    }
    if (k === ' ') {
      e.preventDefault();
      togglePlay();
      return;
    }
    if (k === 'r') {
      e.preventDefault();
      toggleRecord();
      return;
    }
  });

  /* ── Init ── */

  buildGrid();

})();
