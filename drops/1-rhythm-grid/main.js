// Rhythm Grid Game Implementation
// Using Phaser 3 for game logic and interactions

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 400,
    height: 500,
    parent: 'rhythm-grid',
    backgroundColor: '#16213e',
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    }
};

// Game state
let gameState = {
    grid: [],
    isPlaying: false,
    currentStep: 0,
    sequence: [],
    tempo: 120,
    beatDuration: 0,
    lastBeatTime: 0
};

// Create the game
const game = new Phaser.Game(config);

function preload() {
    // Preload assets if needed
    console.log('Preloading assets...');
}

function create() {
    // Initialize the grid
    initializeGrid();
    
    // Setup UI controls
    setupControls();
    
    // Setup game state
    gameState.beatDuration = (60 / gameState.tempo) * 1000; // ms per beat
    
    // Setup keyboard controls
    setupKeyboardControls();
    
    console.log('Rhythm Grid created');
}

function update() {
    // Update game logic
    if (gameState.isPlaying) {
        const currentTime = game.time.now;
        if (currentTime - gameState.lastBeatTime > gameState.beatDuration) {
            updateBeat();
            gameState.lastBeatTime = currentTime;
        }
    }
}

function initializeGrid() {
    // Create 4x4 grid
    gameState.grid = [];
    const gridSize = 4;
    const padSize = 80;
    const gridPadding = 10;
    
    for (let row = 0; row < gridSize; row++) {
        gameState.grid[row] = [];
        for (let col = 0; col < gridSize; col++) {
            // Create pad element
            const padElement = document.createElement('div');
            padElement.className = 'pad';
            padElement.id = `pad-${row}-${col}`;
            padElement.textContent = '';
            padElement.dataset.row = row;
            padElement.dataset.col = col;
            
            // Add click event
            padElement.addEventListener('click', () => togglePad(row, col));
            
            // Add to grid container
            document.getElementById('rhythm-grid').appendChild(padElement);
            
            // Store reference
            gameState.grid[row][col] = {
                element: padElement,
                active: false,
                row: row,
                col: col
            };
        }
    }
}

function setupControls() {
    document.getElementById('play-btn').addEventListener('click', () => {
        togglePlay();
    });
    
    document.getElementById('stop-btn').addEventListener('click', () => {
        stopPlay();
    });
    
    document.getElementById('clear-btn').addEventListener('click', () => {
        clearGrid();
    });
}

function setupKeyboardControls() {
    // Keyboard controls for quick actions
    document.addEventListener('keydown', (event) => {
        switch(event.key) {
            case ' ':
                event.preventDefault();
                togglePlay();
                break;
            case 'c':
                event.preventDefault();
                clearGrid();
                break;
            case 'ArrowUp':
                event.preventDefault();
                increaseTempo();
                break;
            case 'ArrowDown':
                event.preventDefault();
                decreaseTempo();
                break;
        }
    });
}

function togglePad(row, col) {
    // Toggle pad state
    const pad = gameState.grid[row][col];
    pad.active = !pad.active;
    
    // Update visual state
    if (pad.active) {
        pad.element.classList.add('active');
    } else {
        pad.element.classList.remove('active');
    }
    
    // Add to sequence if playing
    if (gameState.isPlaying) {
        addStepToSequence(row, col);
    }
    
    // Update status
    updateStatus();
}

function togglePlay() {
    gameState.isPlaying = !gameState.isPlaying;
    document.getElementById('play-btn').textContent = gameState.isPlaying ? 'Pause' : 'Play';
    
    if (gameState.isPlaying) {
        // Reset to start
        gameState.currentStep = 0;
        updateStatus('Playing...');
    } else {
        updateStatus('Paused');
    }
}

function stopPlay() {
    gameState.isPlaying = false;
    document.getElementById('play-btn').textContent = 'Play';
    gameState.currentStep = 0;
    updateStatus('Stopped');
    
    // Clear highlights
    clearHighlights();
}

function clearGrid() {
    // Clear all pads
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            const pad = gameState.grid[row][col];
            pad.active = false;
            pad.element.classList.remove('active');
        }
    }
    
    // Clear sequence
    gameState.sequence = [];
    
    // Update status
    updateStatus('Cleared');
}

function addStepToSequence(row, col) {
    // Add step to sequence
    gameState.sequence.push({row: row, col: col});
}

function updateBeat() {
    if (!gameState.isPlaying) return;
    
    // Highlight current step
    clearHighlights();
    
    // Highlight the current step in sequence
    if (gameState.sequence.length > 0) {
        const step = gameState.sequence[gameState.currentStep % gameState.sequence.length];
        if (step) {
            const pad = gameState.grid[step.row][step.col];
            pad.element.classList.add('highlight');
        }
    }
    
    // Move to next step
    gameState.currentStep++;
    
    // Update status with current step
    updateStatus(`Playing step ${gameState.currentStep}`);
}

function clearHighlights() {
    // Remove highlight from all pads
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            const pad = gameState.grid[row][col];
            pad.element.classList.remove('highlight');
        }
    }
}

function updateStatus(message = null) {
    const statusElement = document.getElementById('status');
    if (message) {
        statusElement.textContent = message;
    } else {
        statusElement.textContent = `Ready | Tempo: ${gameState.tempo} BPM`;
    }
}

function increaseTempo() {
    gameState.tempo = Math.min(200, gameState.tempo + 10);
    gameState.beatDuration = (60 / gameState.tempo) * 1000;
    updateStatus();
}

function decreaseTempo() {
    gameState.tempo = Math.max(60, gameState.tempo - 10);
    gameState.beatDuration = (60 / gameState.tempo) * 1000;
    updateStatus();
}

// Expose gameState for automated testing
window.gameState = gameState;

console.log('Rhythm Grid initialized');
