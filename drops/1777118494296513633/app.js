// ============================================================
// TB-123 — Main Application Controller
// Static grid UI <-> AudioWorklet bridge
// ============================================================

const STEPS = 16;
const SCALE = [
  { name: 'C5', freq: 523.25 },
  { name: 'A4', freq: 440.00 },
  { name: 'G4', freq: 392.00 },
  { name: 'E4', freq: 329.63 },
  { name: 'D4', freq: 293.66 },
  { name: 'C4', freq: 261.63 },
];

// Grid state: Set of active (row, col) per step column
const grid = new Array(STEPS).fill(null).map(() => new Set());

let audioCtx = null;
let workletNode = null;
let isPlaying = false;
let currentStep = -1;

// ---- DOM REFS ----
const playBtn = document.getElementById('playBtn');
const stopBtn = document.getElementById('stopBtn');
const swingSlider = document.getElementById('swingSlider');
const swingValue = document.getElementById('swingValue');
const filterSlider = document.getElementById('filterSlider');
const filterValue = document.getElementById('filterValue');
const tempoSlider = document.getElementById('tempoSlider');
const tempoValue = document.getElementById('tempoValue');
const cursorPos = document.getElementById('cursorPos');
const gridHeader = document.getElementById('gridHeader');
const gridBody = document.getElementById('gridBody');

// ---- BUILD GRID UI ----
function buildGrid() {
  // Step headers (16 columns)
  gridHeader.innerHTML = '';
  for (let s = 0; s < STEPS; s++) {
    const hdr = document.createElement('div');
    hdr.className = 'step-header' + (s % 4 === 0 ? ' beat' : '');
    hdr.textContent = String(s + 1).padStart(2, '0');
    gridHeader.appendChild(hdr);
  }

  // Note rows
  gridBody.innerHTML = '';
  SCALE.forEach((note, rowIdx) => {
    const row = document.createElement('div');
    row.className = 'note-row';

    const label = document.createElement('div');
    label.className = 'note-label';
    label.textContent = note.name;
    row.appendChild(label);

    for (let col = 0; col < STEPS; col++) {
      const cell = document.createElement('div');
      cell.className = 'step-cell' + (col % 4 === 0 ? ' beat-bound' : '');
      cell.dataset.row = rowIdx;
      cell.dataset.col = col;
      cell.addEventListener('click', () => toggleStep(rowIdx, col, cell));
      row.appendChild(cell);
    }

    gridBody.appendChild(row);
  });
}

function toggleStep(rowIdx, colIdx, cellEl) {
  if (grid[colIdx].has(rowIdx)) {
    grid[colIdx].delete(rowIdx);
    cellEl.classList.remove('active');
  } else {
    grid[colIdx].add(rowIdx);
    cellEl.classList.add('active');
  }

    // Sync grid state to worklet (serialize Sets to arrays)
  if (workletNode) {
      workletNode.port.postMessage({
        type: 'SET_GRID',
        grid: grid.map((s) => Array.from(s)),
      });
    }
}

// ---- AUDIO INIT ----
async function initAudio() {
  if (audioCtx) return;

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  await audioCtx.audioWorklet.addModule('audio-worklet.js');

   workletNode = new AudioWorkletNode(audioCtx, 'pentatonic-worklet', {
     outputCount: 1,
     channelCount: 2,
   });

   workletNode.connect(audioCtx.destination);

    // Initial grid sync
    workletNode.port.postMessage({
      type: 'SET_GRID',
      grid: grid.map((s) => Array.from(s)),
     });
    workletNode.port.postMessage({ type: 'SET_BPM', value: parseInt(tempoSlider.value) });
   workletNode.port.postMessage({
     type: 'SET_FILTER',
     value: mapFilterValue(parseInt(filterSlider.value)),
   });

   // Cursor updates from worklet
   workletNode.port.onmessage = (e) => {
     if (e.data.type === 'CURSOR') {
      updateCursor(e.data.step);
     }
   };
}

// ---- PLAY / STOP ----
playBtn.addEventListener('click', async () => {
  await initAudio();
  if (audioCtx.state === 'suspended') await audioCtx.resume();
  workletNode.port.postMessage({ type: 'PLAY' });
  isPlaying = true;
  playBtn.classList.add('playing');
});

stopBtn.addEventListener('click', () => {
  if (workletNode) {
     workletNode.port.postMessage({ type: 'STOP' });
   }
  isPlaying = false;
  playBtn.classList.remove('playing');
  clearCursor();
  cursorPos.textContent = 'Step: --';
});

// ---- PARAM CONTROLS ----
swingSlider.addEventListener('input', () => {
  swingValue.textContent = swingSlider.value + '%';
  if (workletNode) {
     workletNode.port.postMessage({ type: 'SET_SWING', value: parseInt(swingSlider.value) });
   }
});

filterSlider.addEventListener('input', () => {
  filterValue.textContent = filterSlider.value + '%';
  if (workletNode) {
     workletNode.port.postMessage({
       type: 'SET_FILTER',
       value: mapFilterValue(parseInt(filterSlider.value)),
     });
   }
});

tempoSlider.addEventListener('input', () => {
  tempoValue.textContent = tempoSlider.value;
  if (workletNode) {
     workletNode.port.postMessage({ type: 'SET_BPM', value: parseInt(tempoSlider.value) });
   }
});

// ---- CURSOR ----
function updateCursor(step) {
  clearCursor();
  currentStep = step;
  const cells = document.querySelectorAll(`.step-cell[data-col="${step}"]`);
  cells.forEach((cell) => cell.classList.add('cursor'));
  cursorPos.textContent = `Step: ${String(step + 1).padStart(2, '0')}`;
}

function clearCursor() {
  document.querySelectorAll('.step-cell.cursor').forEach((c) => {
     c.classList.remove('cursor');
   });
}

// ---- FILTER MAPPING ----
// Maps 0-100 slider to 200-8000 Hz
function mapFilterValue(pct) {
  const minLog = Math.log(200);
  const maxLog = Math.log(8000);
  return Math.exp(minLog + (maxLog - minLog) * (pct / 100));
}

// ---- DEFAULT PATTERN ----
function loadDefaultPattern() {
  // A simple breathing pattern across the scale
  const pattern = [
    [0], [2], [],      [3],   // bar 1
    [],  [4], [0],      [],    // bar 2
    [1], [],   [5],     [2],   // bar 3
    [],  [3], [],       [4],   // bar 4
  ];

  pattern.forEach((notes, col) => {
    grid[col].clear();
    notes.forEach((n) => grid[col].add(n));
  });

  // Update UI cells
  document.querySelectorAll('.step-cell').forEach((cell) => {
     const row = parseInt(cell.dataset.row);
     const col = parseInt(cell.dataset.col);
    if (grid[col].has(row)) {
      cell.classList.add('active');
    } else {
      cell.classList.remove('active');
    }
  });

  if (workletNode) {
      workletNode.port.postMessage({
        type: 'SET_GRID',
        grid: grid.map((s) => Array.from(s)),
       });
     }
}

// ---- INIT ----
buildGrid();
loadDefaultPattern();
