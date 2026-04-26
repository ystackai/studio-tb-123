class PentatonicWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bpm = 140;
    this.beatInterval = 60 / this.bpm;
    this.nextBeatTime = 0;
    this.currentStep = 0;
    this.swingAmount = 0.3;
    this.baseFilterCutoff = 2000;
    this.isPlaying = false;
    this.steps = new Array(16).fill(null).map(() => new Set());
    this.quantum = 0.25;        // 1/4 note = 1 step
    this.lookahead = 0.1;
    this.scheduleInterval = 25;  // ms

    // Pentatonic scale (C major pentatonic across 2 octaves)
    this.scale = [
      { name: 'C4', freq: 261.63 },
      { name: 'D4', freq: 293.66 },
      { name: 'E4', freq: 329.63 },
      { name: 'G4', freq: 392.00 },
      { name: 'A4', freq: 440.00 },
      { name: 'C5', freq: 523.25 },
    ];

    this.messagePort.onmessage = (e) => {
      const msg = e.data;
      switch (msg.type) {
        case 'SET_BPM':
          this.bpm = msg.value;
          this.beatInterval = 60 / this.bpm;
          break;
        case 'SET_SWING':
          this.swingAmount = msg.value / 100;
          break;
        case 'SET_FILTER':
          this.baseFilterCutoff = msg.value;
          break;
        case 'SET_STEP':
          this[msg.noteIdx].add(msg.stepIdx);
          if (!msg.noteIdx && msg.stepIdx !== undefined) {
            this.steps[msg.stepIdx].add(msg.noteIdx || 0);
          }
          break;
        case 'SET_GRID':
          this.steps = msg.grid;
          break;
        case 'PLAY':
          this.isPlaying = true;
          this.nextBeatTime = this.context.currentTime + 0.05;
          this.currentStep = 0;
          this.schedulerTimer = setInterval(() => this.schedule(), this.scheduleInterval);
          break;
        case 'STOP':
          this.isPlaying = false;
          if (this.schedulerTimer) clearInterval(this.schedulerTimer);
          break;
      }
    };

    // Internal oscillator / gain / filter nodes managed on render
    this.oscillators = [];
    this.gains = [];
    this.outputValue = new Float32Array(2);
  }

  schedule() {
    if (!this.isPlaying) return;

    const now = this.context.currentTime;

    while (this.nextBeatTime < now + this.lookahead) {
      this.fireStep(this.currentStep, this.nextBeatTime);

      // Update cursor position for UI sync
      this.messagePort.postMessage({
        type: 'CURSOR',
        step: this.currentStep
      });

      this.nextBeatTime += this.beatInterval * this.quantum;
      this.currentStep = (this.currentStep + 1) % 16;
    }
  }

  fireStep(stepIndex, time) {
    const activeNotes = this.steps[stepIndex];
    if (!activeNotes || activeNotes.size === 0) return;

    for (const noteIdx of activeNotes) {
      const note = this.scale[noteIdx];
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      const filter = this.context.createBiquadFilter();

      // Synth voice: warm triangle wave
      osc.type = 'triangle';
      osc.frequency.value = note.freq;

      // Filter swing: cutoff sweeps based on swing amount
      // Even steps: low cutoff breathing, odd steps: higher cutoff opening
      const swingModifier = (stepIndex % 2 === 0)
        ? (1 - this.swingAmount * 0.6)
        : (1 + this.swingAmount * 0.8);
      filter.type = 'lowpass';
      filter.Q.value = 4 + this.swingAmount * 8;
      filter.frequency.value = this.baseFilterCutoff * swingModifier;

      // Envelope
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.18, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, time + this.beatInterval * this.quantum * 3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.context.destination);

      osc.start(time);
      osc.stop(time + this.beatInterval * this.quantum * 4);
    }
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    output[0].fill(0);
    output[1].fill(0);
    return true;
  }
}

registerProcessor('pentatonic-worklet', PentatonicWorklet);
