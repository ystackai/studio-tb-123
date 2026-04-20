// Rhythm Grid implementation
class RhythmGrid {
    constructor() {
        this.gridSize = 4;
        this.pads = [];
        this.sequence = [];
        this.isPlaying = false;
        this.currentStep = 0;
        this.playbackInterval = null;
        this.tempo = 500; // milliseconds between steps
        this.audioContext = null;
        
        this.initializeGrid();
        this.setupEventListeners();
        this.initializeAudio();
    }
    
    initializeGrid() {
        const gridElement = document.getElementById('rhythmGrid');
        gridElement.innerHTML = '';
        this.pads = [];
        
        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            const pad = document.createElement('div');
            pad.className = 'pad';
            pad.dataset.index = i;
            gridElement.appendChild(pad);
            this.pads.push(pad);
        }
    }
    
    setupEventListeners() {
        // Set up pad click events
        this.pads.forEach((pad, index) => {
            pad.addEventListener('click', () => this.togglePad(index));
        });
        
        // Set up control buttons
        document.getElementById('playButton').addEventListener('click', () => this.play());
        document.getElementById('stopButton').addEventListener('click', () => this.stop());
        document.getElementById('clearButton').addEventListener('click', () => this.clear());
    }
    
    togglePad(index) {
        // Toggle the pad state
        const pad = this.pads[index];
        const isActive = pad.classList.contains('active');
        
        if (isActive) {
            pad.classList.remove('active');
            pad.classList.add('inactive');
            this.sequence[index] = false;
        } else {
            pad.classList.remove('inactive');
            pad.classList.add('active');
            this.sequence[index] = true;
        }
        
        // Update the sequence display
        this.updateSequenceDisplay();
    }
    
    updateSequenceDisplay() {
        const sequenceElement = document.getElementById('sequence');
        sequenceElement.innerHTML = '';
        
        this.sequence.forEach((isActive, index) => {
            const pad = document.createElement('div');
            pad.className = `sequence-pad ${isActive ? 'active' : ''}`;
            pad.dataset.index = index;
            sequenceElement.appendChild(pad);
        });
    }
    
    play() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.currentStep = 0;
        this.updatePlayButton();
        
        // Start playback
        this.playbackInterval = setInterval(() => {
            this.playStep();
        }, this.tempo);
    }
    
    stop() {
        this.isPlaying = false;
        clearInterval(this.playbackInterval);
        this.currentStep = 0;
        this.updatePlayButton();
        
        // Reset all pads to inactive
        this.pads.forEach(pad => {
            pad.classList.remove('active');
            pad.classList.add('inactive');
        });
    }
    
    playStep() {
        if (!this.isPlaying) return;
        
        // Highlight current step
        const currentPad = this.pads[this.currentStep];
        if (currentPad && this.sequence[this.currentStep]) {
            currentPad.classList.add('active');
            this.playSound();
            
            // Reset after a short delay
            setTimeout(() => {
                if (this.isPlaying) {
                    currentPad.classList.remove('active');
                    currentPad.classList.add('inactive');
                }
            }, 200);
        }
        
        // Move to next step
        this.currentStep = (this.currentStep + 1) % (this.gridSize * this.gridSize);
    }
    
    playSound() {
        if (!this.audioContext) return;
        
        // Create a simple beep sound using Web Audio API
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 440; // A note
        gainNode.gain.value = 0.1;
        
        oscillator.start(0);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
    
    initializeAudio() {
        // Initialize audio context on first user interaction
        const initAudio = () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            document.removeEventListener('click', initAudio);
        };
        
        document.addEventListener('click', initAudio, { once: true });
    }
    
    clear() {
        this.sequence = Array(this.gridSize * this.gridSize).fill(false);
        this.pads.forEach(pad => {
            pad.classList.remove('active');
            pad.classList.add('inactive');
        });
        this.updateSequenceDisplay();
        this.stop();
    }
    
    updatePlayButton() {
        const playButton = document.getElementById('playButton');
        playButton.textContent = this.isPlaying ? 'Playing...' : 'Play';
    }
}

// Initialize the rhythm grid when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new RhythmGrid();
});
