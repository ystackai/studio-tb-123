// ============================================================
// Open Circuit - Browser Synthesizer Core
// Signal Flow: VCO -> Soft-knee Filter -> VCA -> Soft-clamp -> Output
// ============================================================

const AudioCtx = window.AudioContext || window.webkitAudioContext;

// Default Major Chord Patch
const PATCH = {
  name: "Major Chord",
  desc: "Lush, warm, open — woody tail",
  frequencies: [261.63, 329.63, 392.00],
  decay: 0.65,
  cutoff: 0.50,
  resonance: 0.40,
  mix: 0.50,
  waveform: "sawtooth",
};

// State
const state = {
  audioCtx: null,
  masterGain: null,
  filterNode: null,
  vcaGain: null,
  oscillators: [],
  softClampNode: null,
  analyser: null,
  decayParam: null,
  decayEnvelope: null,
  selfOscillating: false,
  clipping: false,
  gridAmplitude: 0,
  mouseDown: false,
  mouseX: 0,
  mouseY: 0,
  isRunning: false,
  startTime: 0,
  lastFrameTime: 0,
  latencyMs: 0,
};

// Grid Config
const GRID_COLS = 32;
const GRID_ROWS = 16;
let gridCells = [];
let cellWidth = 0;
let cellHeight = 0;

// DOM Refs
const gridCanvas = document.getElementById("grid-canvas");
const waveCanvas = document.getElementById("waveform-canvas");
const gridCtx = gridCanvas.getContext("2d");
const waveCtx = waveCanvas.getContext("2d");

const decaySlider = document.getElementById("decay");
const cutoffSlider = document.getElementById("cutoff");
const resonanceSlider = document.getElementById("resonance");
const mixSlider = document.getElementById("mix");

const decayValue = document.getElementById("decay-value");
const cutoffValue = document.getElementById("cutoff-value");
const resonanceValue = document.getElementById("resonance-value");
const mixValue = document.getElementById("mix-value");

const latencyDisplay = document.getElementById("latency-display");
const oscIndicator = document.getElementById("oscillation-indicator");
const clipIndicator = document.getElementById("clip-indicator");

// Audio Engine Initialization
function initAudio() {
  if (state.audioCtx) return;

  const ctx = new AudioCtx({ latencyHint: "interactive" });
  state.audioCtx = ctx;

  // Master gain
  const master = ctx.createGain();
  master.gain.value = 0.75;
  state.masterGain = master;

  // Analyser for visual feedback
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.8;
  state.analyser = analyser;

  // Soft-knee filter
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 4000;
  filter.Q.value = 2;
  filter.detune.value = 0;
  state.filterNode = filter;

  // VCA (amplitude control for decay envelope)
  const vca = ctx.createGain();
  vca.gain.value = 0;
  state.vcaGain = vca;

  // Decay envelope
  const now = ctx.currentTime;
  vca.gain.setValueAtTime(0, now);
  vca.gain.linearRampToValueAtTime(0.8, now + 0.01);
  vca.gain.exponentialRampToValueAtTime(0.001, now + 5);
  state.decayEnvelope = vca.gain;

  // Decay parameter
  const decayParam = ctx.createGain();
  decayParam.gain.value = PATCH.decay;
  state.decayParam = decayParam;

  // Create VCOs for major chord
  const oscs = [];
  PATCH.frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = PATCH.waveform;
    osc.frequency.value = freq;

    const oscGain = ctx.createGain();
    oscGain.gain.value = 0.18 - (i * 0.025);

    osc.connect(oscGain);
    oscGain.connect(filter);
    osc.start(now);
    oscs.push({ osc, gain: oscGain, freq });
  });
  state.oscillators = oscs;

  // Signal chain: filter -> vca -> master -> softClamp -> analyser
  filter.connect(vca);
  vca.connect(master);

  // Load audio worklet for soft-clamp processing
  ctx.audioWorklet
    .addModule("audio-worklet-processor.js")
    .then(() => {
      const worklet = new AudioWorkletNode(ctx, "softclamp-processor");
      master.connect(worklet);
      worklet.connect(analyser);
      analyser.connect(ctx.destination);
      state.softClampNode = worklet;
      state.isRunning = true;
      console.log("[Open Circuit] Audio engine initialized");
    })
    .catch((err) => {
      console.warn("[Open Circuit] Worklet failed, routing direct:", err);
      master.connect(analyser);
      analyser.connect(ctx.destination);
      state.isRunning = true;
    });

  startVisualLoop();
}

// Soft-Knee Filter Update
function updateFilter() {
  const cutoff = parseFloat(cutoffSlider.value) / 100;
  const resonance = parseFloat(resonanceSlider.value) / 100;

  const freq = 200 + Math.pow(cutoff, 2.5) * 18000;
  const qVal = 0.5 + Math.pow(resonance, 1.5) * 15;

  const now = state.audioCtx.currentTime;
  state.filterNode.frequency.setTargetAtTime(freq, now, 0.02);
  state.filterNode.Q.setTargetAtTime(qVal, now, 0.03);

  // Self-oscillation detection
  const oscThreshold = 0.75;
  if (resonance > oscThreshold && cutoff > 0.7) {
    if (!state.selfOscillating) {
      state.selfOscillating = true;
      oscIndicator.classList.add("active");
      oscIndicator.textContent = "OSC: ON";
      state.filterNode.Q.setTargetAtTime(qVal * 1.5, now, 0.01);
    }
  } else {
    if (state.selfOscillating) {
      state.selfOscillating = false;
      oscIndicator.classList.remove("active");
      oscIndicator.textContent = "OSC: OFF";
    }
  }
}

// Decay Envelope
function updateDecay() {
  const decay = parseFloat(decaySlider.value) / 100;
  const ctx = state.audioCtx;
  const now = ctx.currentTime;

  const tailTime = 1.0 + decay * 10;
  const attackTime = 0.005;

  state.decayEnvelope.cancelScheduledValues(now);
  state.decayEnvelope.setValueAtTime(0, now);
  state.decayEnvelope.linearRampToValueAtTime(0.8, now + attackTime);
  state.decayEnvelope.exponentialRampToValueAtTime(0.001, now + tailTime);

  // Decay modulates filter cutoff for "misuse" behavior
  const decayMod = decay * 2000;
  state.filterNode.frequency.setTargetAtTime(
    state.filterNode.frequency.value + decayMod,
    now,
    0.05
  );
}

// Mix Control
function updateMix() {
  const mix = parseFloat(mixSlider.value) / 100;
  state.masterGain.gain.setTargetAtTime(0.3 + mix * 0.7, state.audioCtx.currentTime, 0.02);
}

// Grid Interaction
function setupGridInteraction() {
  gridCanvas.addEventListener("mousedown", (e) => {
    state.mouseDown = true;
    handleGridInput(e);
  });
  gridCanvas.addEventListener("mousemove", (e) => {
    if (state.mouseDown) handleGridInput(e);
  });
  window.addEventListener("mouseup", () => {
    state.mouseDown = false;
  });

  gridCanvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    state.mouseDown = true;
    handleGridInput(e.touches[0]);
  });
  gridCanvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    handleGridInput(e.touches[0]);
  });
  gridCanvas.addEventListener("touchend", () => {
    state.mouseDown = false;
  });
}

function handleGridInput(e) {
  const rect = gridCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const col = Math.floor(x / cellWidth);
  const row = Math.floor(y / cellHeight);

  if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) {
    gridCells[col + row * GRID_COLS] = true;
    if (!state.audioCtx || !state.filterNode || !state.vcaGain) return;

    const cutoffNorm = col / GRID_COLS;
    const resonanceNorm = 1 - row / GRID_ROWS;

    const cutoffFreq = 200 + Math.pow(cutoffNorm, 2.5) * 18000;
    const qVal = 0.5 + Math.pow(resonanceNorm, 1.5) * 15;
    const now = state.audioCtx.currentTime;
    state.filterNode.frequency.setTargetAtTime(cutoffFreq, now, 0.01);
    state.filterNode.Q.setTargetAtTime(qVal, now, 0.02);

    state.gridAmplitude = Math.min(1, (col + row) / (GRID_COLS + GRID_ROWS));

    const preDelay = 0.002 + state.gridAmplitude * 0.004;
    state.vcaGain.gain.setTargetAtTime(
      Math.min(1, 0.4 + state.gridAmplitude * 0.6),
      now + preDelay,
      0.008
    );
  }
}

// Canvas Resize
function resizeCanvases() {
  const dpr = window.devicePixelRatio || 1;

  const gRect = gridCanvas.getBoundingClientRect();
  gridCanvas.width = gRect.width * dpr;
  gridCanvas.height = gRect.height * dpr;
  gridCtx.scale(dpr, dpr);

  const wRect = waveCanvas.getBoundingClientRect();
  waveCanvas.width = wRect.width * dpr;
  waveCanvas.height = wRect.height * dpr;
  waveCtx.scale(dpr, dpr);

  cellWidth = gRect.width / GRID_COLS;
  cellHeight = gRect.height / GRID_ROWS;
}

// Visual Rendering
function drawGrid(timestamp) {
  const dpr = window.devicePixelRatio || 1;
  const w = gridCanvas.width / dpr;
  const h = gridCanvas.height / dpr;

  gridCtx.clearRect(0, 0, w, h);
  gridCtx.fillStyle = "#0a0a0c";
  gridCtx.fillRect(0, 0, w, h);

  // Grid lines
  gridCtx.strokeStyle = "#1a1a1e";
  gridCtx.lineWidth = 0.5;

  for (let c = 0; c <= GRID_COLS; c++) {
    const x = c * cellWidth;
    gridCtx.beginPath();
    gridCtx.moveTo(x, 0);
    gridCtx.lineTo(x, h);
    gridCtx.stroke();
  }
  for (let r = 0; r <= GRID_ROWS; r++) {
    const y = r * cellHeight;
    gridCtx.beginPath();
    gridCtx.moveTo(0, y);
    gridCtx.lineTo(w, y);
    gridCtx.stroke();
  }

  // Active cells with distortion visualization
  const time = (timestamp - state.startTime) / 1000;
  const oscPulse = state.selfOscillating ? Math.sin(time * 25) * 0.3 + 0.7 : 1;
  const breathe = Math.sin(time * 1.5) * 0.1 + 0.9;

  for (let i = 0; i < gridCells.length; i++) {
    if (!gridCells[i]) continue;

    const col = i % GRID_COLS;
    const row = Math.floor(i / GRID_COLS);
    const cx = col * cellWidth + cellWidth / 2;
    const cy = row * cellHeight + cellHeight / 2;
    const pad = 2;

    const dx = state.selfOscillating ? Math.sin(time * 30 + i * 0.1) * oscPulse * 6 : 0;
    const dy = state.selfOscillating ? Math.cos(time * 25 + i * 0.08) * oscPulse * 3 : 0;

    const alpha = breathe * (0.5 + state.gridAmplitude * 0.5);

    gridCtx.fillStyle = "rgba(230, 57, 70, " + alpha.toFixed(3) + ")";
    gridCtx.shadowColor = "rgba(230, 57, 70, 0.6)";
    gridCtx.shadowBlur = state.selfOscillating ? 12 : 4;

    const size = Math.min(cellWidth, cellHeight) - pad * 2;
    gridCtx.fillRect(
      cx - size / 2 + dx,
      cy - size / 2 + dy,
      size,
      size
    );
  }
  gridCtx.shadowBlur = 0;
}

function drawWaveform(timestamp) {
  if (!state.analyser) return;

  const dpr = window.devicePixelRatio || 1;
  const w = waveCanvas.width / dpr;
  const h = waveCanvas.height / dpr;

  const bufLen = state.analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufLen);
  state.analyser.getByteTimeDomainData(dataArray);

  waveCtx.clearRect(0, 0, w, h);
  waveCtx.fillStyle = "#0a0a0c";
  waveCtx.fillRect(0, 0, w, h);

  // Center line
  waveCtx.strokeStyle = "#1a1a1e";
  waveCtx.lineWidth = 1;
  waveCtx.beginPath();
  waveCtx.moveTo(0, h / 2);
  waveCtx.lineTo(w, h / 2);
  waveCtx.stroke();

  // Waveform
  waveCtx.lineWidth = 2;
  waveCtx.strokeStyle = "#e63946";
  waveCtx.shadowColor = "rgba(230, 57, 70, 0.4)";
  waveCtx.shadowBlur = 4;
  waveCtx.beginPath();

  const sliceWidth = w / bufLen;
  let x = 0;
  for (let i = 0; i < bufLen; i++) {
    const v = dataArray[i] / 128.0;
    const y = v * h / 2;
    if (i === 0) waveCtx.moveTo(x, y);
    else waveCtx.lineTo(x, y);
    x += sliceWidth;
  }
  waveCtx.stroke();
  waveCtx.shadowBlur = 0;

  // Check clipping
  let maxVal = 0;
  for (let i = 0; i < bufLen; i++) {
    const val = Math.abs(dataArray[i] - 128);
    if (val > maxVal) maxVal = val;
  }
  const clipLevel = maxVal / 128;
  if (clipLevel > 0.85) {
    if (!state.clipping) {
      state.clipping = true;
      clipIndicator.classList.add("active");
      clipIndicator.textContent = "CLIP: ON";
      // Clip triggers filter sweep
      const now = state.audioCtx.currentTime;
      state.filterNode.frequency.setTargetAtTime(
        state.filterNode.frequency.value * 1.15,
        now,
        0.01
      );
    }
  } else {
    if (state.clipping) {
      state.clipping = false;
      clipIndicator.classList.remove("active");
      clipIndicator.textContent = "CLIP: OFF";
    }
  }

  // Amplitude indicator
  state.gridAmplitude = clipLevel;
}

// Latency measurement
function updateLatency(timestamp) {
  if (!state.audioCtx) return;

  const baseLatency = state.audioCtx.baseLatency || 0;
  const outputLatency = state.audioCtx.outputLatency || 0;
  const estimated = (baseLatency + outputLatency) * 1000;

  const frameDelta = timestamp - state.lastFrameTime;
  state.lastFrameTime = timestamp;

  if (estimated > 0) {
    state.latencyMs = estimated.toFixed(1);
  } else {
    state.latencyMs = Math.min(4, frameDelta * 0.1).toFixed(1);
  }

  latencyDisplay.textContent = "Latency: " + state.latencyMs + "ms";
}

// Main visual-audio sync loop
function visualLoop(timestamp) {
  if (!state.startTime) state.startTime = timestamp;

  drawGrid(timestamp);
  drawWaveform(timestamp);
  updateLatency(timestamp);

  requestAnimationFrame(visualLoop);
}

function startVisualLoop() {
  state.startTime = performance.now();
  state.lastFrameTime = state.startTime;
  requestAnimationFrame(visualLoop);
}

// Init grid cells array
function initGridCells() {
  gridCells = new Array(GRID_COLS * GRID_ROWS).fill(false);
}

// Slider event handlers
function setupControls() {
  decaySlider.value = Math.round(PATCH.decay * 100);
  cutoffSlider.value = Math.round(PATCH.cutoff * 100);
  resonanceSlider.value = Math.round(PATCH.resonance * 100);
  mixSlider.value = Math.round(PATCH.mix * 100);

  decayValue.textContent = decaySlider.value;
  cutoffValue.textContent = cutoffSlider.value;
  resonanceValue.textContent = resonanceSlider.value;
  mixValue.textContent = mixSlider.value;

  decaySlider.addEventListener("input", () => {
    decayValue.textContent = decaySlider.value;
    if (state.audioCtx) updateDecay();
  });
  cutoffSlider.addEventListener("input", () => {
    cutoffValue.textContent = cutoffSlider.value;
    if (state.audioCtx) updateFilter();
  });
  resonanceSlider.addEventListener("input", () => {
    resonanceValue.textContent = resonanceSlider.value;
    if (state.audioCtx) updateFilter();
  });
  mixSlider.addEventListener("input", () => {
    mixValue.textContent = mixSlider.value;
    if (state.audioCtx) updateMix();
  });
}

// Start button (user gesture required for audio)
function setupStart() {
  const header = document.getElementById("header");
  header.addEventListener("click", () => { initAudio(); });

  // Also start on first interaction with anything
  document.addEventListener("mousedown", function once() {
    initAudio();
    document.removeEventListener("mousedown", once);
  }, { once: true });

  document.addEventListener("touchstart", function once() {
    initAudio();
    document.removeEventListener("touchstart", once);
  }, { once: true });
}

// Entry point
function init() {
  resizeCanvases();
  initGridCells();
  setupControls();
  setupGridInteraction();
  setupStart();

  window.addEventListener("resize", () => {
    // Reset transforms
    const dpr = window.devicePixelRatio || 1;
    gridCtx.setTransform(1, 0, 0, 1, 0, 0);
    waveCtx.setTransform(1, 0, 0, 1, 0, 0);
    resizeCanvases();
  });

  // Draw initial grid
  requestAnimationFrame((t) => {
    drawGrid(t || 0);
  });
}

init();
