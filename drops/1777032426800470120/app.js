// ─── Quantized Filter Toy – grid-locked audio engine ────

// ── Stepped Lookup Tables ──
const CUTOFF_LUT = [
  60, 120, 180, 260, 380, 530, 750, 1100,
  1600, 2400, 3200, 4200, 5400, 6600, 7800, 9600
];
const RES_LUT = [0.1, 0.4, 0.8, 1.4, 2.2, 3.2, 4.5, 6.0, 7.5, 9.0];

// ── Click-prevention constant ──
const RAMP_MS = 0.004; // 4 ms gain ramp per step transition

// ── Knob display state ──
const knobs = {
  cutoff:    { value: 4, max: CUTOFF_LUT.length - 1 },
  resonance: { value: 3, max: RES_LUT.length - 1 },
  bpm:       { value: 120, min: 60, max: 200 },
};

// ── Audio graph refs ──
let actx = null;
let droneA = null, droneB = null;
let biquad = null;
let rampGain   = null; // pre-filter gain – ramps at step boundaries
let stepGate   = null; // post-filter gain – gates rhythm per step
let master = null;

// ── Scheduler refs ──
let playing = false;
let bpm    = 120;
let schedTimer = null;    // the 25ms scheduler ping
let nextStepT  = 0;       // AudioContext time of the next clock step
let clockStep  = 0;       // 0..15 internal position
const LOOKAHEAD  = 0.10;  // schedule 100 ms ahead
const SCHED_MS   = 25;    // ping every 25 ms

// ── DOM refs ──
const svgCutoff = document.getElementById('cutoff-knob');
const svgRes    = document.getElementById('resonance-knob');
const svgBpm    = document.getElementById('bpm-knob');
const svgGrid   = document.getElementById('steps-grid');
const playBtn  = document.getElementById('play-btn');
const bpmLabel = document.getElementById('bpm-label');

// ═══════════════════════════════════════════════════════════
//  AUDIO INIT  – build the DSP graph once
// ═══════════════════════════════════════════════════════════
function initAudio() {
  if (actx) { actx.resume(); return; }
  actx = new (window.AudioContext || window.webkitAudioContext)();

  // Sources
  droneA = actx.createOscillator();
  droneA.type = 'sawtooth';
  droneA.frequency.setValueAtTime(110, actx.currentTime);

  droneB = actx.createOscillator();
  droneB.type = 'triangle';
  droneB.frequency.setValueAtTime(55, actx.currentTime);

  // Click-prevention ramp gain (pre-filter)
  rampGain = actx.createGain();
  rampGain.gain.setValueAtTime(1, actx.currentTime);

  // Low-pass filter
  biquad = actx.createBiquadFilter();
  biquad.type = 'lowpass';
  biquad.frequency.value = CUTOFF_LUT[knobs.cutoff.value];
  biquad.Q.value         = RES_LUT[knobs.resonance.value];

  // Step gate (post-filter) – controls rhythmic pulsing
  stepGate = actx.createGain();
  stepGate.gain.setValueAtTime(1, actx.currentTime);

  master = actx.createGain();
  master.gain.setValueAtTime(0.30, actx.currentTime);

  droneA.connect(rampGain);
  droneB.connect(rampGain);
  rampGain.connect(biquad);
  biquad.connect(stepGate);
  stepGate.connect(master);
  master.connect(actx.destination);

  droneA.start();
  droneB.start();

  // Fade in to avoid startup pop
  rampGain.gain.setValueAtTime(0, actx.currentTime);
  rampGain.gain.linearRampToValueAtTime(1, actx.currentTime + 0.25);
}

// ═══════════════════════════════════════════════════════════
//  GRID-LOCKED SCHEDULER  – lookahead, setValueAtTime only
// ═══════════════════════════════════════════════════════════

/**
 * Schedule a single clock step at the given AudioContext time.
 * All parameter changes use setValueAtTime – no smoothing.
 * Click prevention is handled by a symmetric dip-and-restore
 * gain ramp on rampGain that spans exactly one step window.
 */
function scheduleStep(step, time) {
  // ── Cutoff: stepped LUT, instantaneous setValueAtTime ──
  const baseIdx = knobs.cutoff.value;
  let cutoffIdx = baseIdx;

  // Rhythmic bump: steps 0,4,8,12 open slightly wider
  if (step % 4 === 0) {
    cutoffIdx = Math.min(baseIdx + 2, CUTOFF_LUT.length - 1);
  }
  if (step % 4 === 1) {
    cutoffIdx = baseIdx; // return to base on the following step
  }

  const targetFreq = CUTOFF_LUT[cutoffIdx];

  // Click prevention: dip gain to 0.95 then restore in 4 ms window
  // (only when frequency actually changes)
  const prevFreq = biquad.frequency.value; // current scheduled value snapshot
  if (Math.abs(targetFreq - prevFreq) > 0.5) {
    rampGain.gain.setValueAtTime(0.97, time);
    rampGain.gain.setValueAtTime(1.00, time + RAMP_MS);
  }

  // Hard, instant frequency change on the grid
  biquad.frequency.setValueAtTime(targetFreq, time);

  // Resonance also snaps on step-0 (quarter note boundary)
  if (step === 0) {
    biquad.Q.setValueAtTime(RES_LUT[knobs.resonance.value], time);
  }

  // Step gate: subtle rhythmic volume shaping
  // Steps 0 and 8 get slight volume emphasis
  const gateVal = (step === 0 || step === 8) ? 1.0 : 0.94;
  stepGate.gain.setValueAtTime(gateVal, time);
  stepGate.gain.setValueAtTime(1.0, time + (getStepDuration() * 0.6));
}

function getStepDuration() {
  return (60 / bpm) / 4; // 16th note duration in seconds at current BPM
}

function schedulerTick() {
  // While steps are due, schedule them
  while (nextStepT < actx.currentTime + LOOKAHEAD) {
    scheduleStep(clockStep, nextStepT);

    // Schedule UI update via setTimeout synced to the step
    const delayMs = (nextStepT - actx.currentTime) * 1000;
    const stepForUI = clockStep;
    setTimeout(() => {
      clockStepVis = stepForUI;
      drawStepsGrid();
    }, Math.max(0, delayMs));

    const dur = getStepDuration();
    nextStepT += dur;
    clockStep = (clockStep + 1) % 16;
  }
}

// ═══════════════════════════════════════════════════════════
//  TRANSPORT
// ═══════════════════════════════════════════════════════════
let clockStepVis = 0; // UI-visible step position

function startPlayback() {
  if (playing) return;
  playing = true;
  playBtn.textContent = 'STOP';
  playBtn.classList.add('active');
  nextStepT = actx.currentTime + 0.05;
  clockStep = 0;
  schedTimer = setInterval(schedulerTick, SCHED_MS);
}

function stopPlayback() {
  playing = false;
  playBtn.textContent = 'START';
  playBtn.classList.remove('active');
  clearInterval(schedTimer);
  schedTimer = null;
}

playBtn.addEventListener('click', () => {
  initAudio();
  playing ? stopPlayback() : startPlayback();
});

// ═══════════════════════════════════════════════════════════
//  BPM UPDATE
// ═══════════════════════════════════════════════════════════
function updateBpm(val) {
  bpm = Math.max(60, Math.min(200, Math.round(val)));
  knobs.bpm.value = bpm;
  bpmLabel.textContent = `BPM ${bpm}`;
}

// ═══════════════════════════════════════════════════════════
//  KNOB – SCHEDULE IMMEDIATE FILTER CHANGE ON GRID
// ═══════════════════════════════════════════════════════════
function applyCutoff(idx) {
  if (!actx) return;
  knobs.cutoff.value = idx;
  // Snap filter NOW using setValueAtTime with click-prevention ramp
  const now = actx.currentTime;
  rampGain.gain.setValueAtTime(0.97, now);
  biquad.frequency.setValueAtTime(CUTOFF_LUT[idx], now);
  rampGain.gain.setValueAtTime(1.00, now + RAMP_MS);
}

function applyResonance(idx) {
  if (!actx) return;
  knobs.resonance.value = idx;
  const now = actx.currentTime;
  biquad.Q.setValueAtTime(RES_LUT[idx], now);
}

// ═══════════════════════════════════════════════════════════
//  SVG KNOB RENDERER  – discrete tick marks, snap indicator
// ═══════════════════════════════════════════════════════════
function arcD(cx, cy, r, a0, a1) {
  const x1 = cx + r * Math.cos(a0), y1 = cy + r * Math.sin(a0);
  const x2 = cx + r * Math.cos(a1), y2 = cy + r * Math.sin(a1);
  const large = (a1 - a0) > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

function drawKnob(svg, value, maxIdx, opts) {
  const cx = 80, cy = 80, r = 55;
  const sA = 0.75 * Math.PI;
  const eA = 2.25 * Math.PI;
  const span = eA - sA;
  const norm = maxIdx > 0 ? value / maxIdx : 0;
  const vA = sA + Math.max(0, Math.min(1, norm)) * span;

  let s = '';

  // Background ring
  s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1a1a22" stroke-width="5"/>`;

  // Active arc
  if (norm > 0.01) {
    s += `<path d="${arcD(cx, cy, r, sA, vA)}" fill="none" stroke="${opts.arcColor || '#3a6030'}" stroke-width="3.5" stroke-linecap="round" opacity="0.7"/>`;
  }

  // SVG tick marks – one per quantization step
  const n = maxIdx + 1;
  for (let i = 0; i < n; i++) {
    const tA = sA + (i / (n - 1)) * span;
    const rIn  = r - 12;
    const rOut = r - 1;
    const x1 = cx + rIn  * Math.cos(tA);
    const y1 = cy + rIn  * Math.sin(tA);
    const x2 = cx + rOut * Math.cos(tA);
    const y2 = cy + rOut * Math.sin(tA);
    const on  = (i === value);
    s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${on ? '#a0e060' : '#2d2d36'}" stroke-width="${on ? 2.2 : 1}" stroke-linecap="round"/>`;
  }

  // Value pointer line
  const px = cx + (r - 6) * Math.cos(vA);
  const py = cy + (r - 6) * Math.sin(vA);
  s += `<line x1="${cx}" y1="${cy}" x2="${px}" y2="${py}" stroke="#d0d0d8" stroke-width="2" stroke-linecap="round"/>`;

  // Center hub
  s += `<circle cx="${cx}" cy="${cy}" r="5" fill="#303038"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="2.5" fill="#d0d0d8"/>`;

  // Outer border
  s += `<circle cx="${cx}" cy="${cy}" r="${r + 5}" fill="none" stroke="#222228" stroke-width="1"/>`;

  // Active index label
  if (opts.label !== false) {
    const text = opts.labelFn ? opts.labelFn(value) : `${CUTOFF_LUT[value] || value} Hz`;
    s += `<text x="${cx}" y="${cy + 28}" text-anchor="middle" fill="#6a6a78" font-family="monospace" font-size="11">${text}</text>`;
  }

  svg.innerHTML = s;
}

// ═══════════════════════════════════════════════════════════
//  16-STEP GRID VISUALIZATION
// ═══════════════════════════════════════════════════════════
function drawStepsGrid() {
  const W = 512, H = 64;
  const sw = W / 16;
  let s = '';

  // Background
  s += `<rect width="${W}" height="${H}" fill="#101014" rx="2"/>`;

  // Step cells with active highlight
  for (let i = 0; i < 16; i++) {
    const x = i * sw;
    const active = (i === clockStepVis);
    const beat = (i % 4 === 0);
    const fill  = active ? '#1a3a1a' : (beat ? '#14141a' : '#121218');
    const strk  = active ? '#60c040' : '#24242c';
    const w = active ? 2 : 0.5;
    s += `<rect x="${x + 1}" y="4" width="${sw - 2}" height="${H - 8}" fill="${fill}" stroke="${strk}" stroke-width="${w}" rx="2"/>`;

    // Small dot at top of each beat position
    if (beat) {
      const dotColor = (active && i === clockStepVis) ? '#a0e060' : '#4a4a54';
      s += `<circle cx="${x + sw / 2}" cy="10" r="1.5" fill="${dotColor}"/>`;
    }
  }

  // Grid dividers
  for (let i = 0; i <= 16; i++) {
    const x = i * sw;
    const major = (i % 4 === 0);
    s += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${major ? '#333340' : '#1e1e26'}" stroke-width="${major ? 1 : 0.5}"/>`;
  }

  svgGrid.innerHTML = s;
}

// ═══════════════════════════════════════════════════════════
//  KNOB INTERACTION  – snap-to-grid on drag/click
// ═══════════════════════════════════════════════════════════
function setupKnob(groupEl, cfg) {
  let startY = 0, startV = 0;

  groupEl.addEventListener('mousedown', (e) => {
    e.preventDefault();
    startY = e.clientY;
    startV = cfg.state.value;

    const onMove = (ev) => {
      const dy = ev.clientY - startY;
      const stepSize = dy / -120;
      let raw = startV + stepSize;
      raw = Math.round(raw);                       // snap to integer step
      raw = Math.max(cfg.min, Math.min(cfg.max, raw));
      cfg.state.value = raw;
      cfg.apply(raw);
      cfg.render(raw);
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

// Cutoff
setupKnob(document.getElementById('cutoff-group'), {
  min: 0, max: CUTOFF_LUT.length - 1, state: knobs.cutoff,
  apply: applyCutoff,
  render: (v) => drawKnob(svgCutoff, v, CUTOFF_LUT.length - 1, {
    labelFn: (i) => CUTOFF_LUT[i] + ' Hz',
    arcColor: '#3a6030',
  }),
});

// Resonance
setupKnob(document.getElementById('resonance-group'), {
  min: 0, max: RES_LUT.length - 1, state: knobs.resonance,
  apply: applyResonance,
  render: (v) => drawKnob(svgRes, v, RES_LUT.length - 1, {
    labelFn: (i) => 'Q ' + RES_LUT[i].toFixed(1),
    arcColor: '#405070',
  }),
});

// BPM
setupKnob(document.getElementById('bpm-group'), {
  min: 60, max: 200, state: knobs.bpm,
  apply: updateBpm,
  render: (v) => {
    updateBpm(v);
    drawKnob(svgBpm, v - 60, 200 - 60, {
      labelFn: () => 'BPM ' + bpm,
      arcColor: '#504060',
    });
  },
});

// ═══════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════
drawKnob(svgCutoff, knobs.cutoff.value, CUTOFF_LUT.length - 1, {
  labelFn: (i) => CUTOFF_LUT[i] + ' Hz', arcColor: '#3a6030',
});
drawKnob(svgRes, knobs.resonance.value, RES_LUT.length - 1, {
  labelFn: (i) => 'Q ' + RES_LUT[i].toFixed(1), arcColor: '#405070',
});
drawKnob(svgBpm, knobs.bpm.value - 60, 200 - 60, {
  labelFn: () => 'BPM ' + bpm, arcColor: '#504060',
});
drawStepsGrid();
