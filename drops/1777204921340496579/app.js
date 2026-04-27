// TB-123 Audio Engine & Sequencer

const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let noiseBuffer = null;

// State
let recordGrid = [
   Array(16).fill(false),
   Array(16).fill(false),
   Array(16).fill(false),
   Array(16).fill(false),
 ];
let scheduleStartTime = 0;

const state = {
   bpm: 120,
   playing: false,
   recording: false,
   currentStep: -1,
   lookahead: 20,
   scheduleAheadTime: 0.1,
   lfoRate: 4,
   lfoDepth: 0.3,
   nextNoteTime: 0,
   timerId: null,
   grid: [
     Array(16).fill(false),
     Array(16).fill(false),
     Array(16).fill(false),
     Array(16).fill(false),
   ],
   mode: 'drum',
   waveform: 'saw',
    // Synth params
   cutoff: 2000,
   resonance: 1,
   attack: 0.01,
   decay: 0.3,
   sustain: 0.4,
   release: 0.1,
    // Drum params
   kickDecay: 0.3,
   snareDecay: 0.15,
   hihatDecay: 0.08,
    // Note mapping for synth row (C2-B2 minor pentatonic-ish scale)
   synthNotes: [65.41, 73.42, 82.41, 87.31, 98.00, 103.83, 110.00, 123.47,
                 130.81, 146.83, 155.56, 174.61, 185.00, 207.65, 220.00, 246.94],
   pitch: 0,
 };

function initAudio() {
  if (audioCtx) return;
  audioCtx = new AudioCtx();
  
  // Generate noise buffer
  const bufferSize = audioCtx.sampleRate * 2;
  noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
}

// ---- Drum Sounds ----

function playKick(time, gain = 0.8) {
  if (!audioCtx) initAudio();
  
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(160, time);
  osc.frequency.exponentialRampToValueAtTime(30, time + 0.15);
  
  gainNode.gain.setValueAtTime(gain, time);
  gainNode.gain.exponentialRampToValueAtTime(0.001, time + state.kickDecay);
  
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  osc.start(time);
  osc.stop(time + state.kickDecay + 0.01);
}

function playSnare(time, gain = 0.6) {
  if (!audioCtx) initAudio();
  
  // Noise component
  const noiseSrc = audioCtx.createBufferSource();
  noiseSrc.buffer = noiseBuffer;
  
  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.value = 1500;
  noiseFilter.Q.value = 0.5;
  
  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(gain * 0.7, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + state.snareDecay);
  
  noiseSrc.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(audioCtx.destination);
  
  noiseSrc.start(time);
  noiseSrc.stop(time + state.snareDecay + 0.01);
  
  // Tone component (body)
  const osc = audioCtx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(180, time);
  osc.frequency.exponentialRampToValueAtTime(120, time + 0.06);
  
  const toneGain = audioCtx.createGain();
  toneGain.gain.setValueAtTime(gain * 0.5, time);
  toneGain.gain.exponentialRampToValueAtTime(0.001, time + state.snareDecay * 0.5);
  
  osc.connect(toneGain);
  toneGain.connect(audioCtx.destination);
  
  osc.start(time);
  osc.stop(time + state.snareDecay + 0.01);
}

function playHihat(time, gain = 0.3) {
  if (!audioCtx) initAudio();
  
  const noiseSrc = audioCtx.createBufferSource();
  noiseSrc.buffer = noiseBuffer;
  
  const bandpass = audioCtx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 8000;
  bandpass.Q.value = 1.5;
  
  const highpass = audioCtx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 6000;
  
  const hihatGain = audioCtx.createGain();
  const decay = 0.08;
  hihatGain.gain.setValueAtTime(gain, time);
  hihatGain.gain.exponentialRampToValueAtTime(0.001, time + decay);
  
  noiseSrc.connect(bandpass);
  bandpass.connect(highpass);
  highpass.connect(hihatGain);
  hihatGain.connect(audioCtx.destination);
  
  noiseSrc.start(time);
  noiseSrc.stop(time + decay + 0.01);
}

// ---- Synth Sound ----

function playSynth(time, note = 65, gain = 0.4) {
  if (!audioCtx) initAudio();
  
  // Main oscillator
  const osc = audioCtx.createOscillator();
  osc.type = state.waveform;
  osc.frequency.value = note;

  // Low-pass filter
  const filterNode = audioCtx.createBiquadFilter();
  filterNode.type = 'lowpass';
  filterNode.frequency.value = state.cutoff;
  filterNode.Q.value = state.resonance;

  // LFO for filter modulation
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = 4; // 4Hz modulation rate
  lfoGain.gain.value = state.cutoff * 0.3; // Depth relative to cutoff

  lfo.connect(lfoGain);
  lfoGain.connect(filterNode.frequency);
  
   // ADSR envelope on gain
  const envGain = audioCtx.createGain();
  const atk = Math.max(state.attack, 0.001);
  const dec = state.decay;
  const susLevel = state.sustain;
  const susTime = getSecondsPerStep() * 2;
  const rel = state.release;
  const totalDur = atk + dec + susTime + rel;
  
  envGain.gain.setValueAtTime(0.001, time);
  envGain.gain.linearRampToValueAtTime(gain, time + atk);
  envGain.gain.linearRampToValueAtTime(gain * susLevel, time + atk + dec);
  envGain.gain.setValueAtTime(gain * susLevel, time + atk + dec + susTime);
  envGain.gain.linearRampToValueAtTime(0.001, time + atk + dec + susTime + rel);
  
  osc.connect(filterNode);
  filterNode.connect(envGain);
  envGain.connect(audioCtx.destination);
  
  osc.start(time);
  osc.stop(time + totalDur + 0.01);
  
  lfo.start(time);
  lfo.stop(time + totalDur + 0.01);
}

// ---- Scheduler ----

function scheduler() {
  while (state.nextNoteTime < audioCtx.currentTime + state.scheduleAheadTime) {
    scheduleStep(state.currentStep, state.nextNoteTime);
    advanceStep();
  }
}

function scheduleStep(step, time) {
  if (state.grid[0][step]) playKick(time);
  if (state.grid[1][step]) playSnare(time);
  if (state.grid[2][step]) playHihat(time);
  if (state.grid[3][step]) playSynth(time, state.synthNotes[step]);
  
  if (state.recording) {
    recordGrid[0][step] |= state.grid[0][step];
    recordGrid[1][step] |= state.grid[1][step];
    recordGrid[2][step] |= state.grid[2][step];
    recordGrid[3][step] |= state.grid[3][step];
  }
}

function advanceStep() {
  state.currentStep = (state.currentStep + 1) % 16;
  state.nextNoteTime += getSecondsPerStep();
}

function getSecondsPerStep() {
  // BPM -> seconds per 16th note
  return 60.0 / state.bpm / 4;
}

function updateCurrentStep(step) {
  if (state.currentStep === step) {
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('playing'));
    for (let row = 0; row < 4; row++) {
      const cell = document.querySelector(`.cells[data-row="${row}"] .cell:nth-child(${step + 1})`);
      if (cell) cell.classList.add('playing');
    }
  }
}

// ---- Transport ----

function resetRecordGrid() {
  for (let i = 0; i < 4; i++) {
    recordGrid[i] = Array(16).fill(false);
   }
 }

function startPlayback() {
   if (!audioCtx) initAudio();
   
   if (audioCtx.state === 'suspended') {
     audioCtx.resume();
     }
   
   if (state.playing) return;
   
   if (state.recording) {
     resetRecordGrid();
    }
   
   state.playing = true;
   state.currentStep = 0;
   scheduleStartTime = audioCtx.currentTime;
   state.nextNoteTime = audioCtx.currentTime + 0.05;
   state.timerId = setInterval(scheduler, state.lookahead);
   
   document.getElementById('btn-play').classList.add('active');
   lastVisualStep = -1;
   animationFrameId = requestAnimationFrame(visualSyncLoop);
  
   // Auto-enable some grid cells for demo
  if (state.grid[0].every(x => !x) &&
      state.grid[1].every(x => !x) &&
      state.grid[2].every(x => !x) &&
      state.grid[3].every(x => !x)) {
    state.grid[0][0] = true;
    state.grid[0][4] = true;
    state.grid[0][8] = true;
    state.grid[0][12] = true;
    state.grid[1][4] = true;
    state.grid[1][12] = true;
    state.grid[2][0] = true;
    state.grid[2][2] = true;
    state.grid[2][4] = true;
    state.grid[2][6] = true;
    state.grid[2][8] = true;
    state.grid[2][10] = true;
    state.grid[2][12] = true;
    state.grid[2][14] = true;
    state.grid[3][0] = true;
    state.grid[3][8] = true;
    renderGrid();
   }
}

function stopPlayback() {
   if (!state.playing) return;
   
   state.playing = false;
   clearInterval(state.timerId);
   state.timerId = null;
   state.currentStep = -1;
   
   if (state.recording) {
       // Commit recorded grid
     for (let row = 0; row < 4; row++) {
       for (let col = 0; col < 16; col++) {
         state.grid[row][col] = recordGrid[row][col];
        }
       }
     renderGrid();
     state.recording = false;
     document.getElementById('btn-record').classList.remove('active');
     }
   
   document.getElementById('btn-play').classList.remove('active');
   document.querySelectorAll('.cell').forEach(c => c.classList.remove('playing'));
   
   if (animationFrameId) {
     cancelAnimationFrame(animationFrameId);
     animationFrameId = null;
     }
 }

function togglePlayback() {
  if (state.playing) {
    stopPlayback();
  } else {
    startPlayback();
  }
}

// ---- WAV Export ----

function exportWav() {
  if (!audioCtx) initAudio();
  
  stopPlayback();
  
  const sampleRate = audioCtx.sampleRate;
  const stepsPerBar = 16;
  const secondsPerStep = getSecondsPerStep();
  const totalDuration = stepsPerBar * secondsPerStep + 0.5;
  const totalSamples = Math.ceil(sampleRate * totalDuration);
  
  const offlineCtx = new OfflineAudioContext(2, totalSamples, sampleRate);
  
  // Schedule all steps in offline context
  for (let step = 0; step < stepsPerBar; step++) {
    const time = step * secondsPerStep;
    
    // Need to play sounds directly on offline context
    // We'll create a simple recording of what would play
    if (state.grid[0][step]) {
      playSoundToOffline(offlineCtx, 'kick', time, step);
    }
    if (state.grid[1][step]) {
      playSoundToOffline(offlineCtx, 'snare', time, step);
    }
    if (state.grid[2][step]) {
      playSoundToOffline(offlineCtx, 'hihat', time, step);
    }
    if (state.grid[3][step]) {
      playSoundToOffline(offlineCtx, 'synth', time, step);
    }
  }
  
  offlineCtx.startRendering().then((buffer) => {
    const wav = audioBufferToWav(buffer);
    const blob = new Blob([wav], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tb123-export.wav';
    a.click();
    URL.revokeObjectURL(url);
  });
}

function playSoundToOffline(ctx, type, time, step) {
  // Reuse logic but route to offline context
  if (type === 'kick') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(30, time + 0.15);
    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + state.kickDecay);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + state.kickDecay + 0.01);
  } else if (type === 'snare') {
    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buf;
    
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1500;
    
    const nG = ctx.createGain();
    nG.gain.setValueAtTime(0.42, time);
    nG.gain.exponentialRampToValueAtTime(0.001, time + state.snareDecay);
    noise.connect(hp);
    hp.connect(nG);
    nG.connect(ctx.destination);
    noise.start(time);
    noise.stop(time + state.snareDecay + 0.01);
    
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(120, time + 0.06);
    const tG = ctx.createGain();
    tG.gain.setValueAtTime(0.3, time);
    tG.gain.exponentialRampToValueAtTime(0.001, time + state.snareDecay * 0.5);
    osc.connect(tG);
    tG.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + state.snareDecay + 0.01);
  } else if (type === 'hihat') {
    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buf;
    
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 8000;
    bp.Q.value = 1.5;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 6000;
    
    const g = ctx.createGain();
    const decay = 0.08;
    g.gain.setValueAtTime(0.3, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + decay);
    
    noise.connect(bp);
    bp.connect(hp);
    hp.connect(g);
    g.connect(ctx.destination);
    noise.start(time);
    noise.stop(time + decay + 0.01);
  } else if (type === 'synth') {
    const osc = ctx.createOscillator();
    osc.type = state.waveform;
    osc.frequency.value = state.synthNotes[step];
    
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 4;
    lfoG.gain.value = state.cutoff * 0.3;
    lfo.connect(lfoG);
    
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = state.cutoff;
    filt.Q.value = state.resonance;
    lfoG.connect(filt.frequency);
    
    const env = ctx.createGain();
    const atk = Math.max(state.attack, 0.001);
    const dec = state.decay;
    const susT = 0.3;
    const rel = 0.1;
    env.gain.setValueAtTime(0.001, time);
    env.gain.linearRampToValueAtTime(0.4, time + atk);
    env.gain.linearRampToValueAtTime(0.16, time + atk + dec);
    env.gain.setValueAtTime(0.16, time + atk + dec + susT);
    env.gain.linearRampToValueAtTime(0.001, time + atk + dec + susT + rel);
    
    osc.connect(filt);
    filt.connect(env);
    env.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + atk + dec + susT + rel + 0.01);
    lfo.start(time);
    lfo.stop(time + atk + dec + susT + rel + 0.01);
  }
}

function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  let result;
  if (numChannels === 2) {
    result = interleaveChannels(buffer);
  } else {
    result = buffer.getChannelData(0);
  }
  
  const dataLength = result.length * (bitDepth / 8);
  const headerLength = 44;
  const totalLength = headerLength + dataLength;
  
  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);
  
  // Write samples
  let offset = 44;
  for (let i = 0; i < result.length; i++) {
    const sample = Math.max(-1, Math.min(1, result[i]));
    const val = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    view.setInt16(offset, val, true);
    offset += 2;
  }
  
  return arrayBuffer;
}

function interleaveChannels(buffer) {
  const channels = [];
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }
  const length = channels[0].length;
  const result = new Float32Array(length * channels.length);
  let idx = 0;
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < channels.length; ch++) {
      result[idx++] = channels[ch][i];
    }
  }
  return result;
}

function writeString(view, offset, str) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// ---- UI Wiring ----

function renderGrid() {
  for (let row = 0; row < 4; row++) {
    const cellsContainer = document.querySelector(`.cells[data-row="${row}"]`);
    if (!cellsContainer) continue;
    
    for (let col = 0; col < 16; col++) {
      const cell = cellsContainer.children[col];
      if (!cell) continue;
      
      if (state.grid[row][col]) {
        cell.classList.add('on');
      } else {
        cell.classList.remove('on');
      }
    }
  }
}

function initGrid() {
  const channels = ['kick', 'snare', 'hihat', 'synth'];
  document.querySelectorAll('.grid-row').forEach((rowEl, rowIdx) => {
    const cellsContainer = rowEl.querySelector('.cells');
    cellsContainer.innerHTML = '';
    
    for (let col = 0; col < 16; col++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (col > 0 && col % 4 === 0) {
        cell.classList.add('cell-lead');
      }
      cell.addEventListener('click', () => {
        if (!audioCtx) initAudio();
        state.grid[rowIdx][col] = !state.grid[rowIdx][col];
        renderGrid();
        
        // Preview sound on toggle on
        if (state.grid[rowIdx][col]) {
          playImmediate(rowIdx, col);
        }
      });
      cellsContainer.appendChild(cell);
    }
  });
}

function playImmediate(row, col) {
  switch (row) {
    case 0: playKick(audioCtx ? audioCtx.currentTime : 0); break;
    case 1: playSnare(audioCtx ? audioCtx.currentTime : 0); break;
    case 2: playHihat(audioCtx ? audioCtx.currentTime : 0); break;
    case 3: playSynth(audioCtx ? audioCtx.currentTime : 0, state.synthNotes[col]); break;
  }
}

function setupTransport() {
  document.getElementById('btn-play').addEventListener('click', togglePlayback);
  document.getElementById('btn-stop').addEventListener('click', stopPlayback);
  document.getElementById('btn-record').addEventListener('click', () => {
    state.recording = !state.recording;
    document.getElementById('btn-record').classList.toggle('active', state.recording);
  });
  document.getElementById('btn-export').addEventListener('click', exportWav);
  
  document.getElementById('bpm-slider').addEventListener('input', (e) => {
    const oldBpm = state.bpm;
    state.bpm = parseInt(e.target.value);
    document.getElementById('bpm-display').textContent = state.bpm;
    
     // Reschedule timing if playing so there's no drift
    if (state.playing) {
     const oldStepDur = 60.0 / oldBpm / 4;
     const newStepDur = getSecondsPerStep();
      // Recalculate nextNoteTime from current step position
     const stepsSinceStart = state.currentStep - 0;
     const elapsedSteps = ((audioCtx.currentTime - scheduleStartTime) / oldStepDur);
      // Keep time aligned to where we are
     const currentStepFloat = elapsedSteps % 16;
     const completedSteps = Math.floor(elapsedSteps);
     state.nextNoteTime = audioCtx.currentTime + (state.currentStep - (completedSteps % 16)) * newStepDur;
    }
   });
}

function setupModeToggle() {
  const drumBtn = document.getElementById('mode-drum');
  const synthBtn = document.getElementById('mode-synth');
  
  drumBtn.addEventListener('click', () => {
    state.mode = 'drum';
    drumBtn.classList.add('active');
    synthBtn.classList.remove('active');
    document.getElementById('drum-controls').classList.remove('hidden');
    document.getElementById('synth-controls').classList.add('hidden');
  });
  
  synthBtn.addEventListener('click', () => {
    state.mode = 'synth';
    synthBtn.classList.add('active');
    drumBtn.classList.remove('active');
    document.getElementById('synth-controls').classList.remove('hidden');
    document.getElementById('drum-controls').classList.add('hidden');
  });
}

function setupSliders() {
  // Synth controls
  document.getElementById('ctrl-cutoff').addEventListener('input', (e) => {
    state.cutoff = parseInt(e.target.value);
    document.getElementById('val-cutoff').textContent = `${state.cutoff} Hz`;
  });
  
  document.getElementById('ctrl-res').addEventListener('input', (e) => {
    state.resonance = parseFloat(e.target.value);
    document.getElementById('val-res').textContent = state.resonance.toFixed(1);
  });
  
  document.getElementById('ctrl-attack').addEventListener('input', (e) => {
    state.attack = parseFloat(e.target.value);
    document.getElementById('val-atk').textContent = `${state.attack.toFixed(2)}s`;
  });
  
  document.getElementById('ctrl-decay').addEventListener('input', (e) => {
    state.decay = parseFloat(e.target.value);
    document.getElementById('val-dec').textContent = `${state.decay.toFixed(2)}s`;
  });
  
  // Waveform selection
  document.querySelectorAll('.wave-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.wave-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.waveform = btn.dataset.wave;
    });
  });
  
  // Drum controls
  document.getElementById('ctrl-kick-decay').addEventListener('input', (e) => {
    state.kickDecay = parseFloat(e.target.value);
    document.getElementById('val-kick-dec').textContent = `${state.kickDecay.toFixed(2)}s`;
  });
  
  document.getElementById('ctrl-snare-decay').addEventListener('input', (e) => {
    state.snareDecay = parseFloat(e.target.value);
    document.getElementById('val-snare-dec').textContent = `${state.snareDecay.toFixed(2)}s`;
  });
}

function setupKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (!audioCtx) initAudio();
    
    switch (e.key.toLowerCase()) {
      case '1':
        playKick(audioCtx.currentTime);
        pulseCell(0, -1);
        break;
      case '2':
        playSnare(audioCtx.currentTime);
        pulseCell(1, -1);
        break;
      case '3':
        playHihat(audioCtx.currentTime);
        pulseCell(2, -1);
        break;
      case '4':
        playSynth(audioCtx.currentTime, 65);
        pulseCell(3, -1);
        break;
      case ' ':
        e.preventDefault();
        togglePlayback();
        break;
      case 'r':
        state.recording = !state.recording;
        document.getElementById('btn-record').classList.toggle('active', state.recording);
        break;
      case 'e':
        exportWav();
        break;
    }
  });
}

function pulseCell(row, col) {
  const cellsContainer = document.querySelector(`.cells[data-row="${row}"]`);
  if (!cellsContainer) return;
  
  if (col >= 0) {
    const cell = cellsContainer.children[col];
    if (cell) {
      cell.classList.add('playing');
      setTimeout(() => cell.classList.remove('playing'), 100);
    }
  } else {
    // Pulse all cells in row for keyboard input
    Array.from(cellsContainer.children).forEach(cell => {
      cell.classList.add('playing');
      setTimeout(() => cell.classList.remove('playing'), 100);
    });
  }
}

// ---- Visual sync ----

let animationFrameId = null;
let lastVisualStep = -1;

function visualSyncLoop() {
   if (!state.playing) {
     animationFrameId = null;
     return;
    }
   
   const now = audioCtx.currentTime;
   const secondsPerStep = getSecondsPerStep();
   const elapsed = now - scheduleStartTime;
   const currentVisualStep = Math.floor(elapsed / secondsPerStep) % 16;
   
   if (currentVisualStep !== lastVisualStep) {
     lastVisualStep = currentVisualStep;
     updateCurrentStep(currentVisualStep);
    }
   
   animationFrameId = requestAnimationFrame(visualSyncLoop);
 }

// ---- Initialization ----

function init() {
  initGrid();
  setupTransport();
  setupModeToggle();
  setupSliders();
  setupKeyboard();
}

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
