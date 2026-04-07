// Rhythm Grid implementation
class RhythmGrid {
    constructor() {
        this.grid = [];
        this.sequence = [];
        this.isPlaying = false;
        this.currentStep = 0;
        this.audioContext = null;
        this.playbackInterval = null;
        
        // Initialize the grid
        this.initGrid();
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    initGrid() {
        const gridElement = document.getElementById('rhythmGrid');
        gridElement.innerHTML = '';
        
        // Create 4x4 grid
        for (let i = 0; i < 16; i++) {
            const pad = document.createElement('div');
            pad.className = 'pad';
            pad.dataset.index = i;
            pad.textContent = i + 1;
            
            // Add click event
            pad.addEventListener('click', () => this.togglePad(i));
            
            gridElement.appendChild(pad);
            this.grid.push(pad);
        }
    }
    
    setupEventListeners() {
        document.getElementById('playButton').addEventListener('click', () => this.play());
        document.getElementById('stopButton').addEventListener('click', () => this.stop());
        document.getElementById('clearButton').addEventListener('click', () => this.clear());
    }
    
    togglePad(index) {
        // Toggle pad state
        const pad = this.grid[index];
        pad.classList.toggle('active');
        
        // Update sequence
        if (this.sequence[index] === undefined) {
            this.sequence[index] = false;
        }
        this.sequence[index] = !this.sequence[index];
        
        // Update display
        this.updateSequenceDisplay();
    }
    
    play() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.currentStep = 0;
        this.updateSequenceDisplay();
        
        // Create audio context if it doesn't exist
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Play sequence
        this.playbackInterval = setInterval(() => {
            this.playStep();
            this.currentStep++;
            
            if (this.currentStep >= 16) {
                this.stop();
            }
        }, 300);
    }
    
    playStep() {
        if (this.currentStep >= 16) return;
        
        // Visual feedback
        const pad = this.grid[this.currentStep];
        pad.classList.add('playing');
        
        // Audio feedback
        this.playSound();
        
        // Remove visual feedback after a short delay
        setTimeout(() => {
            pad.classList.remove('playing');
        }, 150);
    }
    
    playSound() {
        if (!this.audioContext) return;
        
        // Create oscillator for sound
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 220 + (Math.random() * 440); // Random pitch
        gainNode.gain.value = 0.1;
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
    
    stop() {
        this.isPlaying = false;
        clearInterval(this.playbackInterval);
        this.currentStep = 0;
        
        // Reset all pads
        this.grid.forEach(pad => {
            pad.classList.remove('playing');
        });
        
        this.updateSequenceDisplay();
    }
    
    clear() {
        this.sequence = [];
        this.stop();
        
        // Reset all pads
        this.grid.forEach(pad => {
            pad.classList.remove('active');
        });
        
        this.updateSequenceDisplay();
    }
    
    updateSequenceDisplay() {
        const sequenceElement = document.getElementById('sequence');
        sequenceElement.innerHTML = '';
        
        for (let i = 0; i < 16; i++) {
            const item = document.createElement('div');
            item.className = 'sequence-item';
            
            if (this.sequence[i] === true) {
                item.classList.add('active');
            }
            
            if (this.isPlaying && i === this.currentStep) {
                item.classList.add('active');
            }
            
            sequenceElement.appendChild(item);
        }
    }
}

// Initialize the rhythm grid when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new RhythmGrid();
});
