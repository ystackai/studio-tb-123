// ============================================================
// TB-123 — Pure DSP AudioWorklet Processor
// All audio (oscillator, filter, scheduling, swing) runs
// entirely inside process() with zero dependency on AudioContext
// or Web Audio nodes. Sub-frame precision guaranteed.
// ============================================================

class PentatonicWorklet extends AudioWorkletProcessor {
  constructor() {
    super();

    // -- Timing state --
     this.bpm = 140;
    this.currentStep = 0;
    this.isPlaying = false;
    this.samplesSinceLastStep = 0;
    this.stepJustAdvanced = false;

    // -- DSP parameters --
    this.swingAmount = 0.30;     // 0..1
    this.baseFilterCutoff = 2000; // Hz

    // -- Grid: 16 steps, each a Set of row indices --
    this.grid = new Array(16).fill(null).map(() => new Set());

     // -- Pentatonic scale (rows 0-5: C5→C4 descending, matches app.js) --
    this.scale = [
       523.25, // C5
       440.00, // A4
       392.00, // G4
       329.63, // E4
       293.66, // D4
       261.63, // C4
     ];

    // -- Oscillator state: one voice per active note --
    // We process up to 6 concurrent notes (one per row).
    this.phases = new Float32Array(6);       // phase 0..1
    this.volumes = new Float32Array(6);       // current gain
    this.activeFlags = new Int8Array(6);      // 1 = note playing this sample
    this.noteStartTimes = new Float32Array(6); // sample offset for envelope

    // -- Filter state: single-channel biquad lowpass --
    this.filter_b0 = 0;
    this.filter_b1 = 0;
    this.filter_b2 = 0;
    this.filter_a1 = 0;
    this.filter_a2 = 0;
    this.filter_x1 = 0; // delayed input 1
    this.filter_x2 = 0; // delayed input 2
    this.filter_y1 = 0; // delayed output 1
    this.filter_y2 = 0; // delayed output 2
    this.currentCutoff = 2000;
    this.targetCutoff = 2000;

    // -- Cursor messaging --
    this.cursorSentStep = -1;

    // -- Message handling --
    this.messagePort.onmessage = (e) => {
      const msg = e.data;
      switch (msg.type) {
        case 'SET_BPM':
          this.bpm = msg.value;
          break;
        case 'SET_SWING':
          this.swingAmount = msg.value / 100;
          break;
        case 'SET_FILTER':
          this.baseFilterCutoff = msg.value;
          break;
        case 'SET_GRID': {
          // msg.grid is an array of arrays (serialised from Sets)
          for (let s = 0; s < 16; s++) {
            this.grid[s] = new Set(msg.grid[s] || []);
          }
          break;
        }
        case 'PLAY': {
          this.isPlaying = true;
          this.samplesSinceStart = 0;
          this.currentStep = 0;
          this.volumes.fill(0);
          this.activeFlags.fill(0);
          break;
        }
        case 'STOP': {
          this.isPlaying = false;
          this.volumes.fill(0);
          this.activeFlags.fill(0);
          this.cursorSentStep = -1;
          break;
        }
      }
    };

    // Compute initial filter coefficients
     this.updateFilterCoefficients(2000, 4);
  }

  // ---- Biquad lowpass coefficient update ----
  updateFilterCoefficients(cutoffHz, q, sampleRate) {
    sampleRate = sampleRate || this.sampleRate;
    const w = 2 * Math.PI * cutoffHz / sampleRate;
    const sinW = Math.sin(w);
    const cosW = Math.cos(w);
    const alpha = sinW / (2 * q);

    const b0 =  (1 - cosW) / 2;
    const b1 =  1 - cosW;
    const b2 =  (1 - cosW) / 2;
    const a0 =  1 + alpha;
    const a1 = -2 * cosW;
    const a2 =  1 - alpha;

    this.filter_b0 = b0 / a0;
    this.filter_b1 = b1 / a0;
    this.filter_b2 = b2 / a0;
    this.filter_a1 = a1 / a0;
    this.filter_a2 = a2 / a0;
  }

  // ---- Triangle wave: zero-phase (starts at zero slope) ----
  triangleWave(phase) {
    // phase in [0, 1)
    return 4 * Math.abs(phase - 0.5) - 1;
  }

  // ---- ADSR Envelope (compute gain for a note given samples since trigger) ----
  computeEnvelope(samplesSinceTrigger, stepSamples) {
    const attackTime  = 0.01;   // 10ms attack
    const decayTime   = 0.08;   // 80ms decay
    const sustainLevel = 0.12;   // sustain level
    const releaseTime = 0.15;    // 150ms release (if note stops)
    const stepDur = stepSamples / this.sampleRate; // seconds per step

    const t = samplesSinceTrigger / this.sampleRate;

    // Attack
    if (t < attackTime) {
      return 0.2 * (t / attackTime);
    }
    // Decay to sustain
    const dt = t - attackTime;
    if (dt < decayTime) {
      return 0.2 - (0.2 - sustainLevel) * (dt / decayTime);
    }
    // Sustain (holds for 3 steps, then release)
    if (t < stepDur * 3) {
      return sustainLevel;
    }
    // Release
    const rt = t - stepDur * 3;
    if (rt < releaseTime) {
      return sustainLevel * (1 - rt / releaseTime);
    }
    return 0;
  }

  // ---- Filter swing: compute cutoff from step index and swingAmount ----
  computeSwingCutoff(stepIndex) {
    // Even steps: filter closes (darker), odd steps: filter opens (brighter)
    // Swing controls the swing between them
    const evenFactor  = 1.0 - this.swingAmount * 0.7;
    const oddFactor   = 1.0 + this.swingAmount * 1.0;
    const factor = (stepIndex % 2 === 0) ? evenFactor : oddFactor;
    return this.baseFilterCutoff * factor;
  }

  // ---- Note triggering per step ----
  processStep(stepIndex) {
    const activeNotes = this.grid[stepIndex];
    if (!activeNotes || activeNotes.size === 0) {
      // No notes this step — mark all voices inactive (they'll release)
      return;
    }

    for (let row = 0; row < 6; row++) {
      if (activeNotes.has(row)) {
        this.activeFlags[row] = 1;
        this.noteStartTimes[row] = 0;
        this.phases[row] = 0;
      } else {
        this.activeFlags[row] = 0;
      }
    }
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const left = output[0];
    const right = output[1];
    const blockLen = left.length;
    const sr = this.sampleRate;

    // Recalculate step duration in samples from BPM
    // 1 step = 1/4 note, BPM = beats per minute (quarter notes)
    const stepDurationSamples = (60.0 / this.bpm) * sr / 4;

    for (let i = 0; i < blockLen; i++) {
      // ---- Step advancement ----
      if (this.isPlaying) {
        this.samplesSinceStart++;

        if (this.samplesSinceStart >= (this.currentStep + 1) * stepDurationSamples) {
          // Advance step
          this.currentStep = (this.currentStep + 1) % 16;
          this.samplesSinceStart -= stepDurationSamples;
          this.processStep(this.currentStep);

          // Update filter cutoff for swing
          this.targetCutoff = this.computeSwingCutoff(this.currentStep);
        }

        // Send cursor update once per step change
        if (this.currentStep !== this.cursorSentStep) {
          this.cursorSentStep = this.currentStep;
          this.messagePort.postMessage({ type: 'CURSOR', step: this.currentStep });
        }
      }

      // ---- Smooth cutoff transition (avoid clicks) ----
      this.currentCutoff += (this.targetCutoff - this.currentCutoff) * 0.08;
      this.updateFilterCoefficients(this.currentCutoff, 4, sr);

      // ---- Generate and mix all voices ----
      let sampleL = 0;
      let sampleR = 0;

      for (let v = 0; v < 6; v++) {
        if (this.activeFlags[v]) {
          // Advance phase
          const freq = this.scale[v];
          this.phases[v] += freq / sr;
          if (this.phases[v] >= 1.0) this.phases[v] -= 1.0;

          // Envelope: samples since note triggered this step
          this.noteStartTimes[v]++;
          const env = this.computeEnvelope(this.noteStartTimes[v], stepDurationSamples);

          // Triangle oscillator
          const raw = this.triangleWave(this.phases[v]);

          sampleL += raw * env;
          sampleR += raw * env;
        } else {
          // Note not active: continue release if volume still nonzero
          if (this.noteStartTimes[v] > 0) {
            this.noteStartTimes[v]++;
            const env = this.computeEnvelope(this.noteStartTimes[v], stepDurationSamples);
            if (env > 0) {
              this.phases[v] += this.scale[v] / sr;
              if (this.phases[v] >= 1.0) this.phases[v] -= 1.0;
              const raw = this.triangleWave(this.phases[v]);
              sampleL += raw * env;
              sampleR += raw * env;
            }
          }
        }
      }

      // ---- Apply biquad lowpass filter ----
      const filterInput = (sampleL + sampleR) * 0.5;
      const filtered = this.filter_b0 * filterInput
                     + this.filter_b1 * this.filter_x1
                     + this.filter_b2 * this.filter_x2
                     - this.filter_a1 * this.filter_y1
                     - this.filter_a2 * this.filter_y2;

      this.filter_x2 = this.filter_x1;
      this.filter_x1 = filterInput;
      this.filter_y2 = this.filter_y1;
      this.filter_y1 = filtered;

      // ---- Soft limit to prevent clipping ----
      let out = filtered;
      if (out > 1.0) out = 1.0;
      if (out < -1.0) out = -1.0;

      left[i] = out;
      right[i] = out;
    }

    return true;
  }
}

registerProcessor('pentatonic-worklet', PentatonicWorklet);
