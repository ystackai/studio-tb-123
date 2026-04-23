// Audio context
let audioContext;
let isPlaying = false;
let sequence = Array(4).fill().map(() => Array(4).fill(false));
let currentStep = 0;
let playInterval;

// DOM elements
const grid = document.getElementById('grid');
const playBtn = document.getElementById('playBtn');
const stopBtn = document.getElementById('stopBtn');
const clearBtn = document.getElementById('clearBtn');
const statusText = document.getElementById('statusText');

// Initialize the grid
function initGrid() {
    grid.innerHTML = '';
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            const pad = document.createElement('div');
            pad.className = 'pad';
            pad.dataset.row = row;
            pad.dataset.col = col;
            pad.addEventListener('click', () => togglePad(row, col));
            grid.appendChild(pad);
        }
    }
}

// Toggle pad state
function togglePad(row, col) {
    sequence[row][col] = !sequence[row][col];
    updateGrid();
    playPadSound(row, col);
}

// Update grid display
function updateGrid() {
    const pads = document.querySelectorAll('.pad');
    pads.forEach(pad => {
        const row = parseInt(pad.dataset.row);
        const col = parseInt(pad.dataset.col);
        if (sequence[row][col]) {
            pad.classList.add('active');
        } else {
            pad.classList.remove('active');
        }
    });
}

// Play pad sound
function playPadSound(row, col) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Create oscillator and envelope
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Configure oscillator
    oscillator.type = 'sine';
    oscillator.frequency.value = 200 + (row * 100) + (col * 20);
    
    // Configure envelope
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Start and stop oscillator
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
}

// Play sequence
function playSequence() {
    if (!isPlaying) return;
    
    // Clear previous step
    const pads = document.querySelectorAll('.pad');
    pads.forEach(pad => pad.classList.remove('active'));
    
    // Play current step
    for (let row = 0; row < 4; row++) {
        if (sequence[row][currentStep]) {
            const pad = document.querySelector(`.pad[data-row="${row}"][data-col="${currentStep}"]`);
            if (pad) {
                pad.classList.add('active');
                playPadSound(row, currentStep);
            }
        }
    }
    
    // Update step
    currentStep = (currentStep + 1) % 4;
    
    // Update status
    statusText.textContent = `Playing step ${currentStep + 1}`;
}

// Start playing
function startPlaying() {
    if (isPlaying) return;
    
    isPlaying = true;
    currentStep = 0;
    playBtn.textContent = 'Playing...';
    playInterval = setInterval(playSequence, 500);
    statusText.textContent = 'Playing sequence';
}

// Stop playing
function stopPlaying() {
    isPlaying = false;
    clearInterval(playInterval);
    playBtn.textContent = 'Play';
    statusText.textContent = 'Stopped';
    
    // Clear active pads
    const pads = document.querySelectorAll('.pad');
    pads.forEach(pad => pad.classList.remove('active'));
}

// Clear sequence
function clearSequence() {
    sequence = Array(4).fill().map(() => Array(4).fill(false));
    updateGrid();
    stopPlaying();
    statusText.textContent = 'Cleared';
}

// Event listeners
playBtn.addEventListener('click', startPlaying);
stopBtn.addEventListener('click', stopPlaying);
clearBtn.addEventListener('click', clearSequence);

// Initialize
initGrid();
updateGrid();
