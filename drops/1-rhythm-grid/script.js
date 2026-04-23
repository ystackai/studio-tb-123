// Rhythm Grid Implementation
class RhythmGrid {
  constructor() {
    this.grid = [];
    this.sequence = [];
    this.isPlaying = false;
    this.playInterval = null;
    this.audioContext = null;
    this.init();
  }

  init() {
    this.createGrid();
    this.setupEventListeners();
    this.initAudio();
  }

  createGrid() {
    const gridContainer = document.getElementById('rhythmGrid');
    this.grid = [];
    
    for (let row = 0; row < 4; row++) {
      this.grid[row] = [];
      for (let col = 0; col < 4; col++) {
        const pad = document.createElement('div');
        pad.className = 'grid-pad';
        pad.dataset.row = row;
        pad.dataset.col = col;
        pad.textContent = '';
        gridContainer.appendChild(pad);
        this.grid[row][col] = pad;
      }
    }
  }

  setupEventListeners() {
    // Add click listeners to grid pads
    document.querySelectorAll('.grid-pad').forEach(pad => {
      pad.addEventListener('click', (e) => this.handlePadClick(e));
    });

    // Add control button listeners
    document.getElementById('playButton').addEventListener('click', () => this.playSequence());
    document.getElementById('stopButton').addEventListener('click', () => this.stopSequence());
    document.getElementById('clearButton').addEventListener('click', () => this.clearSequence());
  }

  handlePadClick(event) {
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    
    // Toggle pad state
    this.grid[row][col].classList.toggle('active');
    
    // Update sequence
    this.updateSequence(row, col);
    
    // Update sequence display
    this.updateSequenceDisplay();
  }

  updateSequence(row, col) {
    // Create a unique identifier for this position
    const position = `${row}-${col}`;
    
    // Find if this position is already in sequence
    const index = this.sequence.indexOf(position);
    
    if (index > -1) {
      // Remove from sequence if already exists
      this.sequence.splice(index, 1);
    } else {
      // Add to sequence
      this.sequence.push(position);
    }
  }

  updateSequenceDisplay() {
    const sequenceOutput = document.getElementById('sequenceOutput');
    sequenceOutput.innerHTML = '';
    
    // Create visual representation of sequence
    this.sequence.forEach(position => {
      const [row, col] = position.split('-').map(Number);
      const pad = document.createElement('div');
      pad.className = 'sequence-pad active';
      sequenceOutput.appendChild(pad);
    });
    
    // Add empty pads for the remaining positions
    const remaining = 16 - this.sequence.length;
    for (let i = 0; i < remaining; i++) {
      const pad = document.createElement('div');
      pad.className = 'sequence-pad';
      sequenceOutput.appendChild(pad);
    }
  }

  initAudio() {
    // Initialize Web Audio API
    if (typeof window.AudioContext !== 'undefined') {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playSequence() {
    if (this.isPlaying || this.sequence.length === 0) return;
    
    this.isPlaying = true;
    let index = 0;
    
    // Play the sequence
    this.playInterval = setInterval(() => {
      if (index >= this.sequence.length) {
        this.stopSequence();
        return;
      }
      
      const position = this.sequence[index];
      const [row, col] = position.split('-').map(Number);
      
      // Visual feedback
      this.grid[row][col].classList.add('active');
      
      // Play sound if audio context is available
      if (this.audioContext) {
        this.playSound(row, col);
      }
      
      // Remove visual feedback after delay
      setTimeout(() => {
        this.grid[row][col].classList.remove('active');
      }, 200);
      
      index++;
    }, 500);
  }

  stopSequence() {
    if (this.playInterval) {
      clearInterval(this.playInterval);
      this.playInterval = null;
    }
    this.isPlaying = false;
  }

  clearSequence() {
    // Clear all active pads
    document.querySelectorAll('.grid-pad').forEach(pad => {
      pad.classList.remove('active');
    });
    
    // Clear sequence
    this.sequence = [];
    
    // Update display
    this.updateSequenceDisplay();
    
    // Stop playing if needed
    this.stopSequence();
  }

  playSound(row, col) {
    // Create oscillator for sound generation
    if (!this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Set oscillator type and frequency based on position
    oscillator.type = 'sine';
    
    // Different frequencies for different rows (lower to higher)
    const baseFreq = 100 + (row * 100);
    oscillator.frequency.value = baseFreq + (col * 20);
    
    // Set volume
    gainNode.gain.value = 0.1;
    
    // Play for a short duration
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }
}

// Initialize the rhythm grid when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new RhythmGrid();
});
