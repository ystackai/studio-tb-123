// ─── Quantized Filter Toy ────────────────────────────────────────────

// ── Cutoff Frequency Lookup Table (8 discrete steps, musical-ish Hz map) ──
const CUTOFF_STEPS = [
  60,   120,  180,  260,  380,  530,  750,  1100,  1600, 2400,
  3200, 4200, 5400, 6600, 7800, 9600
]; // 16 quantized positions

const RESONANCE_STEPS = [0.1, 0.4, 0.8, 1.4, 2.2, 3.2, 4.5, 6.0, 7.5, 9.0];

// ── State ──
let audioCtx = null;
let droneNode = null;
let filterNode = null;
let gainNode = null;
let isPlaying = false;
let currentCutoffIdx = 4;
let currentResIdx = 3;
let bpm = 120;
let clockInterval = null;
let currentStep = 0;

// ── Knob state ──
const knobs = {
  cutoff: { value: 4, min: 0, max: CUTOFF_STEPS.length - 1, totalSteps: CUTOFF_STEPS.length },
  resonance: { value: 3, min: 0, max: RESONANCE_STEPS.length - 1, totalSteps: RESONANCE_STEPS.length },
  bpm: { value: 120, min: 60, max: 200, totalSteps: 141 },
};

// ── DOM refs ──
const cutoffSvg = document.getElementById('cutoff-knob');
const resSvg = document.getElementById('resonance-knob');
const bpmSvg = document.getElementById('bpm-knob');
const gridSvg = document.getElementById('steps-grid');
const playBtn = document.getElementById('play-btn');
const bpmLabel = document.getElementById('bpm-label');

// ─── Audio init ───
function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // Drone oscillator
  droneNode = audioCtx.createOscillator();
  droneNode.type = 'sawtooth';
  droneNode.frequency.setValueAtTime(110, audioCtx.currentTime); // A2

  // Second oscillator for warmth
  const drone2 = audioCtx.createOscillator();
  drone2.type = 'triangle';
  drone2.frequency.setValueAtTime(55, audioCtx.currentTime); // A1

  // Filter
  filterNode = audioCtx.createBiquadFilter();
  filterNode.type = 'lowpass';
  filterNode.Q.value = RESONANCE_STEPS[knobs.resonance.value];
  filterNode.frequency.value = CUTOFF_STEPS[knobs.cutoff.value];

  // Envelope gain for click prevention
  gainNode = audioCtx.createGain();
  gainNode.gain.value = 0;

  const master = audioCtx.createGain();
  master.gain.value = 0.35;

  droneNode.connect(filterNode);
  drone2.connect(filterNode);
  filterNode.connect(gainNode);
  gainNode.connect(master);
  master.connect(audioCtx.destination);

  droneNode.start();
  drone2.start();

  // Fade in
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.6, audioCtx.currentTime + 0.3);
}

// ─── Quantized filter change with click prevention ───
function setFilterCutoff(index) {
  if (!filterNode || !audioCtx) return;
  currentCutoffIdx = index;
  const targetFreq = CUTOFF_STEPS[index];
  const now = audioCtx.currentTime;
  // Gentle crossfade to avoid clicks
  filterNode.frequency.setTargetAtTime(targetFreq, now, 0.015);
}

function setResonance(index) {
  if (!filterNode || !audioCtx) return;
  currentResIdx = index;
  const targetQ = RESONANCE_STEPS[index];
  const now = audioCtx.currentTime;
  filterNode.Q.setTargetAtTime(targetQ, now, 0.015);
}

// ─── Clock system ───
function tickClock() {
  currentStep = (currentStep + 1) % 16;

  // Pulse filter on certain steps for rhythmic effect
  if (isPlaying && filterNode) {
    const baseIdx = knobs.cutoff.value;
    // Subtle rhythmic modulation: on steps 0 and 8, bump cutoff up briefly
    if (currentStep === 0 || currentStep === 8) {
      const now = audioCtx.currentTime;
      const boostedIdx = Math.min(baseIdx + 2, CUTOFF_STEPS.length - 1);
      filterNode.frequency.setValueAtTime(CUTOFF_STEPS[boostedIdx], now);
      const releaseStep = currentStep === 0 ? 1 : 9;
      // Will return on next tick
    } else if (currentStep === 1 || currentStep === 9) {
      const now = audioCtx.currentTime;
      filterNode.frequency.setTargetAtTime(CUTOFF_STEPS[baseIdx], now, 0.04);
    }
  }

  drawStepsGrid();
}

function startClock() {
  if (clockInterval) return;
  const msPerBeat = 60000 / bpm;
  const msPer16th = msPerBeat / 4;
  clockInterval = setInterval(tickClock, msPer16th);
}

function stopClock() {
  if (clockInterval) {
    clearInterval(clockInterval);
    clockInterval = null;
  }
}

function updateBpm(newBpm) {
  bpm = Math.round(newBpm);
  bpm = Math.max(60, Math.min(200, bpm));
  knobs.bpm.value = bpm;
  bpmLabel.textContent = `BPM ${bpm}`;
  if (isPlaying) {
    stopClock();
    startClock();
  }
  drawKnob(bpmSvg, knobs.bpm, 60, 200, bpm);
}

// ─── Knob rendering (SVG) ───
function drawKnob(svg, knobState, min, max, displayVal) {
  const cx = 80, cy = 80, r = 56;
  const numTicks = knobState.totalSteps;
  const startAngle = 0.75 * Math.PI;
  const endAngle = 2.25 * Math.PI;
  const rangeAngle = endAngle - startAngle;

  const normalized = (displayVal - min) / (max - min);
  const clamped = Math.max(0, Math.min(1, normalized));
  const valueAngle = startAngle + clamped * rangeAngle;

  let inner = '';

  // Background ring
  inner += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#222228" stroke-width="6"/>`;

  // Track arc (active portion)
  const trackSvg = arcPath(cx, cy, r, startAngle, valueAngle);
  inner += `<path d="${trackSvg}" fill="none" stroke="#3a6030" stroke-width="4" stroke-linecap="round"/>`;

  // Tick marks for each discrete step
  for (let i = 0; i < numTicks; i++) {
    const tickAngle = startAngle + (i / (numTicks - 1)) * rangeAngle;
    const innerR = r - 14;
    const outerR = r - 2;
    const x1 = cx + innerR * Math.cos(tickAngle);
    const y1 = cy + innerR * Math.sin(tickAngle);
    const x2 = cx + outerR * Math.cos(tickAngle);
    const y2 = cy + outerR * Math.sin(tickAngle);
    const isActive = (i === displayVal);
    const color = isActive ? '#a0e060' : '#3a3a44';
    const sw = isActive ? 2.5 : 1;
    inner += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${sw}"/>`;
  }

  // Value pointer
  const px = cx + (r - 4) * Math.cos(valueAngle);
  const py = cy + (r - 4) * Math.sin(valueAngle);
  inner += `<line x1="${cx}" y1="${cy}" x2="${px}" y2="${py}" stroke="#e0e0e8" stroke-width="2" stroke-linecap="round"/>`;

  // Center dot
  inner += `<circle cx="${cx}" cy="${cy}" r="4" fill="#e0e0e8"/>`;

  // Outer ring
  inner += `<circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="none" stroke="#222228" stroke-width="1"/>`;

  svg.innerHTML = inner;
}

function arcPath(cx, cy, r, start, end) {
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  const largeArc = (end - start) > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

// ─── 16-step grid visualization ───
function drawStepsGrid() {
  const w = 512, h = 64;
  const stepW = w / 16;
  let inner = '';

  // Grid lines
  for (let i = 0; i <= 16; i++) {
    const x = i * stepW;
    const color = i % 4 === 0 ? '#3a3a44' : '#1e1e24';
    inner += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="${color}" stroke-width="1"/>`;
  }

  // Step cells
  for (let i = 0; i < 16; i++) {
    const x = i * stepW;
    const isActive = i === currentStep;
    const color = isActive ? '#a0e060' : '#1c1c24';
    const sw = isActive ? 2 : 0.5;
    inner += `<rect x="${x + 1}" y="4" width="${stepW - 2}" height="${h - 8}" fill="${color}" stroke="${isActive ? '#60c040' : '#2a2a32'}" stroke-width="${sw}" rx="1"/>`;
  }

  // Bottom line
  inner += `<line x1="0" y1="${h - 1}" x2="${w}" y2="${h - 1}" stroke="#3a3a44" stroke-width="1"/>`;

  gridSvg.innerHTML = inner;
}

// ─── Knob interaction ───
function setupKnobInteraction(groupEl, knobId) {
  const svgMap = {
    cutoff: { el: cutoffSvg, state: knobs.cutoff, dataMin: 0, dataMax: CUTOFF_STEPS.length - 1, dataSteps: CUTOFF_STEPS.length, apply: (v) => { setFilterCutoff(v); drawKnob(cutoffSvg, knobs.cutoff, 0, CUTOFF_STEPS.length - 1, v); } },
    resonance: { el: resSvg, state: knobs.resonance, dataMin: 0, dataMax: RESONANCE_STEPS.length - 1, dataSteps: RESONANCE_STEPS.length, apply: (v) => { setResonance(v); drawKnob(resSvg, knobs.resonance, 0, RESONANCE_STEPS.length - 1, v); } },
    bpm: { el: bpmSvg, state: knobs.bpm, dataMin: 60, dataMax: 200, dataSteps: 141, apply: (v) => updateBpm(v) },
  }[knobId];

  let startY = 0;
  let startVal = 0;

  groupEl.addEventListener('mousedown', (e) => {
    startY = e.clientY;
    startVal = svgMap.state.value;
    const onMove = (ev) => {
      const dy = startY - ev.clientY;
      const sensitivity = 1 / (svgMap.dataSteps - 1) * 120;
      let raw = startVal + dy * sensitivity;
      // Snap to nearest step
      const clampedVal = Math.round(raw);
      const finalVal = Math.max(svgMap.dataMin, Math.min(svgMap.dataMax, clampedVal));
      svgMap.state.value = finalVal;
      svgMap.apply(finalVal);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  // Click to set directly
  svgMap.el.addEventListener('click', (e) => {
    const rect = svgMap.el.getBoundingClientRect();
    const relY = (e.clientY - rect.top) / rect.height;
    const clampedY = Math.max(0.15, Math.min(0.85, relY));
    let raw = svgMap.dataMax - (clampedY - 0.15) / 0.7 * (svgMap.dataMax - svgMap.dataMin);
    const snapped = Math.round(raw);
    const finalVal = Math.max(svgMap.dataMin, Math.min(svgMap.dataMax, snapped));
    svgMap.state.value = finalVal;
    svgMap.apply(finalVal);
  });
}

// ─── Transport ───
playBtn.addEventListener('click', () => {
  initAudio();
  if (!isPlaying) {
    isPlaying = true;
    playBtn.textContent = 'STOP';
    playBtn.classList.add('active');
    startClock();
  } else {
    isPlaying = false;
    playBtn.textContent = 'START';
    playBtn.classList.remove('active');
    stopClock();
  }
});

// ─── Init ───
setupKnobInteraction(document.getElementById('cutoff-group'), 'cutoff');
setupKnobInteraction(document.getElementById('resonance-group'), 'resonance');
setupKnobInteraction(document.getElementById('bpm-group'), 'bpm');

drawKnob(cutoffSvg, knobs.cutoff, 0, CUTOFF_STEPS.length - 1, knobs.cutoff.value);
drawKnob(resSvg, knobs.resonance, 0, RESONANCE_STEPS.length - 1, knobs.resonance.value);
drawKnob(bpmSvg, knobs.bpm, 60, 200, knobs.bpm.value);
drawStepsGrid();
