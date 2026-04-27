const GRID_SIZE = 8;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

let audioCtx = null;
let masterGain = null;
let filterNode = null;
let activeOscillators = [];
let activeGainNodes = [];
let isAudioInitialized = false;

const defaultPatch = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0]
];

const majorChordFreqs = {
    C3: 130.81,
    E3: 164.81,
    G3: 196.00,
    C4: 261.63,
    E4: 329.63,
    G4: 392.00
};

function initAudio() {
    if (isAudioInitialized) return;

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    filterNode = audioCtx.createBiquadFilter();

    filterNode.type = 'lowpass';
    filterNode.frequency.value = 8000;
    filterNode.Q.value = 2;

    const compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    masterGain.gain.value = 0.7;

    filterNode.connect(compressor);
    compressor.connect(masterGain);
    masterGain.connect(audioCtx.destination);

    isAudioInitialized = true;
}

function getCellFrequency(row, col) {
    const noteIndex = Math.floor(row) + Math.floor(col * (GRID_SIZE / 2));
    const baseFreq = 130.81;
    return baseFreq * Math.pow(2, noteIndex / 12);
}

function playTone(freq, decayMs, cutoffHz) {
    if (!isAudioInitialized) initAudio();

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const now = audioCtx.currentTime;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + (decayMs / 1000));

    filterNode.frequency.cancelScheduledValues(now);
    filterNode.frequency.setValueAtTime(cutoffHz, now);
    filterNode.frequency.exponentialRampToValueAtTime(Math.max(cutoffHz * 0.5, 200), now + (decayMs / 1000));

    osc.connect(gainNode);
    gainNode.connect(filterNode);

    osc.start(now);
    osc.stop(now + (decayMs / 1000) + 0.1);

    activeOscillators.push(osc);
    activeGainNodes.push(gainNode);

    setTimeout(() => {
        const oscIdx = activeOscillators.indexOf(osc);
        if (oscIdx > -1) {
            activeOscillators.splice(oscIdx, 1);
            activeGainNodes.splice(oscIdx, 1);
        }
    }, (decayMs / 1000 + 0.2) * 1000);
}

function playDefaultPatch() {
    initAudio();
    stopAllNotes();

    const decay = parseInt(document.getElementById('decay-knob').value);
    const cutoff = parseInt(document.getElementById('cutoff-knob').value);

    const chordNotes = [
        { freq: majorChordFreqs.C3, type: 'sawtooth' },
        { freq: majorChordFreqs.E3, type: 'triangle' },
        { freq: majorChordFreqs.G3, type: 'sawtooth' },
        { freq: majorChordFreqs.C4, type: 'triangle' }
    ];

    chordNotes.forEach(note => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        const now = audioCtx.currentTime;

        const shouldSoftClamp = note.freq > 300;
        if (shouldSoftClamp) {
            note.freq = Math.min(note.freq, 12000);
        }

        osc.type = note.type;
        osc.frequency.setValueAtTime(note.freq, now);

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.12, now + 0.05);
        gainNode.gain.setValueAtTime(0.12, now + 0.3);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + (decay / 1000));

        osc.connect(gainNode);
        gainNode.connect(filterNode);

        osc.start(now);
        osc.stop(now + (decay / 1000) + 0.2);

        activeOscillators.push(osc);
        activeGainNodes.push(gainNode);

        setTimeout(() => {
            const oscIdx = activeOscillators.indexOf(osc);
            if (oscIdx > -1) {
                activeOscillators.splice(oscIdx, 1);
                activeGainNodes.splice(oscIdx, 1);
            }
        }, (decay / 1000 + 0.3) * 1000);
    });
}

function stopAllNotes() {
    activeOscillators.forEach(osc => {
        try {
            const now = audioCtx.currentTime;
            const gainIdx = activeOscillators.indexOf(osc);
            if (gainIdx > -1 && activeGainNodes[gainIdx]) {
                activeGainNodes[gainIdx].gain.cancelScheduledValues(now);
                activeGainNodes[gainIdx].gain.setValueAtTime(activeGainNodes[gainIdx].gain.value, now);
                activeGainNodes[gainIdx].gain.linearRampToValueAtTime(0, now + 0.02);
            }
            osc.stop(now + 0.03);
        } catch (e) {}
    });
    activeOscillators = [];
    activeGainNodes = [];
}

function buildGrid() {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';

    for (let i = 0; i < TOTAL_CELLS; i++) {
        const row = Math.floor(i / GRID_SIZE);
        const col = i % GRID_SIZE;

        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.dataset.index = i;

        if (defaultPatch[row] && defaultPatch[row][col]) {
            cell.classList.add('active');
        }

        cell.addEventListener('mousedown', (e) => {
            e.preventDefault();
            initAudio();
            toggleCell(cell);
        });

        cell.addEventListener('mouseenter', (e) => {
            if (e.buttons === 1) {
                e.preventDefault();
                initAudio();
                activateCell(cell);
            }
        });

        grid.appendChild(cell);
    }
}

function toggleCell(cell) {
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    const isActive = cell.classList.toggle('active');

    if (isActive) {
        const freq = getCellFrequency(row, col);
        const decay = parseInt(document.getElementById('decay-knob').value);
        const cutoff = parseInt(document.getElementById('cutoff-knob').value);
        playTone(freq, decay, cutoff);
    }
}

function activateCell(cell) {
    if (!cell.classList.contains('active')) {
        cell.classList.add('active');
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const freq = getCellFrequency(row, col);
        const decay = parseInt(document.getElementById('decay-knob').value);
        const cutoff = parseInt(document.getElementById('cutoff-knob').value);
        playTone(freq, decay, cutoff);

        const distortionCells = document.querySelectorAll('.cell.active');
        if (distortionCells.length > 16) {
            cell.classList.add('distorted');
            setTimeout(() => cell.classList.remove('distorted'), 300);
        }
    }
}

function setupControls() {
    const cutoffKnob = document.getElementById('cutoff-knob');
    const decayKnob = document.getElementById('decay-knob');
    const cutoffValue = document.getElementById('cutoff-value');
    const decayValue = document.getElementById('decay-value');

    cutoffKnob.addEventListener('input', () => {
        const val = cutoffKnob.value;
        cutoffValue.textContent = `${val} Hz`;

        if (isAudioInitialized && filterNode) {
            filterNode.frequency.cancelScheduledValues(audioCtx.currentTime);
            filterNode.frequency.setValueAtTime(val, audioCtx.currentTime);

            if (val > 8000) {
                filterNode.Q.value = 3;
            } else {
                filterNode.Q.value = 2;
            }
        }

        if (isAudioInitialized) {
            playInteractionSound('filter');
        }
    });

    decayKnob.addEventListener('input', () => {
        const val = decayKnob.value;
        decayValue.textContent = `${val} ms`;
        if (isAudioInitialized) {
            playInteractionSound('decay');
        }
    });
}

function playInteractionSound(type) {
    if (!isAudioInitialized) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const now = audioCtx.currentTime;

    if (type === 'filter') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2000, now);
        osc.frequency.linearRampToValueAtTime(4000, now + 0.05);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.08);
    } else if (type === 'decay') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.06);
    } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(3000, now);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    }

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 3000;

    osc.connect(gain);
    gain.connect(filter);
    filter.connect(masterGain);

    osc.start(now);
    osc.stop(now + 0.12);
}

function updateLatencyDisplay() {
    const latencyDisplay = document.getElementById('latency-display');
    if (audioCtx) {
        const latency = (audioCtx.baseLatency + audioCtx.outputLatency) * 1000;
        const rounded = Math.max(4.0, Math.min(latency, 12.0)).toFixed(1);
        latencyDisplay.textContent = `${rounded}ms`;
    }
}

function init() {
    buildGrid();
    setupControls();

    document.addEventListener('click', () => {
        if (!isAudioInitialized) {
            initAudio();
        }
    }, { once: false });

    document.getElementById('stage').addEventListener('click', () => {
        if (!isAudioInitialized) {
            initAudio();
            playDefaultPatch();
        }
    }, { once: true });

    setInterval(updateLatencyDisplay, 2000);
}

document.addEventListener('DOMContentLoaded', init);
