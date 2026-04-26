// ============================================================
// TB-123 — Pure DSP AudioWorklet Processor
// Sub-frame precision sequencer with filter-based swing.
// ============================================================

class PentatonicWorklet extends AudioWorkletProcessor {
  constructor() {
    super();

    // -- Timing state --
    this.bpm = 140;
    this.currentStep = 0;
    this.isPlaying = false;
    this.samplesSinceStepStart = 0;

    // -- DSP parameters --
    this.swingAmount = 0.30;
    this.baseFilterCutoff = 2000;

    // -- Grid: 16 steps, each a Set of active row indices --
    this.grid = new Array(16).fill(null).map(() => new Set());

    // -- Pentatonic scale (rows 0-5: C5→C4 descending) --
    this.scale = [
      523.25, // C5
      440.00, // A4
      392.00, // G4
      329.63, // E4
      293.66, // D4
      261.63, // C4
    ];

    // -- Voice state: one voice per row (6 total) --
    this.phases         = new Float32Array(6);
    this.voiceActive    = new Int8Array(6);      // 1 = note triggered and held
    this.voiceReleasing = new Int8Array(6);      // 1 = note in release phase
    this.voiceStartSample = new Float32Array(6); // samples since trigger or release-start
    this.prevGridRows   = new Set();              // rows active in previous step

     // -- Filter state: single-channel biquad lowpass --
    this.filter_b0 = 0;
    this.filter_b1 = 0;
    this.filter_b2 = 0;
    this.filter_a1 = 0;
    this.filter_a2 = 0;
    this.filter_x1 = 0;
    this.filter_x2 = 0;
    this.filter_y1 = 0;
    this.filter_y2 = 0;
    this.currentCutoff = 2000;
    this.targetCutoff = 2000;

     // -- LFO state for continuous breath --
    this.lfoPhase = 0;
    this.lfoSpeed = 0.125; // ~2-second cycle at 140 BPM

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
          for (let s = 0; s < 16; s++) {
            this.grid[s] = new Set(msg.grid[s] || []);
          }
          break;
        }
        case 'PLAY': {
          this.isPlaying = true;
          this.currentStep = 0;
          this.samplesSinceStepStart = 0;
          this.prevGridRows.clear();
          this.voiceActive.fill(0);
          this.voiceReleasing.fill(0);
          this.voiceStartSample.fill(0);
          this.phases.fill(0);
          break;
        }
        case 'STOP': {
          this.isPlaying = false;
          this.voiceActive.fill(0);
          this.voiceReleasing.fill(0);
          this.voiceStartSample.fill(0);
          this.prevGridRows.clear();
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

    const b0 = (1 - cosW) / 2;
    const b1 = 1 - cosW;
    const b2 = (1 - cosW) / 2;
    const a0 = 1 + alpha;
    const a1 = -2 * cosW;
    const a2 = 1 - alpha;

    this.filter_b0 = b0 / a0;
    this.filter_b1 = b1 / a0;
    this.filter_b2 = b2 / a0;
    this.filter_a1 = a1 / a0;
    this.filter_a2 = a2 / a0;
  }

  // ---- Triangle wave: zero-crossing at phase 0 ----
  triangleWave(phase) {
    return 4 * Math.abs(phase - 0.5) - 1;
  }

  // ---- ADSR Envelope ----
  // samplesSinceTrigger: samples since note triggered (if !releasing)
  //                      or samples since release started (if releasing)
  computeEnvelope(samplesSinceTrigger, isReleasing) {
    const attackTime   = 0.01;   // 10 ms
    const decayTime    = 0.08;   // 80 ms
    const sustainLevel = 0.12;
    const releaseTime  = 0.15;   // 150 ms

    const t = samplesSinceTrigger / this.sampleRate;

    if (isReleasing) {
      // Release phase
      if (t < releaseTime) {
        return sustainLevel * (1 - t / releaseTime);
      }
      return 0;
    }

    // Attack
    if (t < attackTime) {
      return 0.2 * (t / attackTime);
    }
    // Decay to sustain
    const dt = t - attackTime;
    if (dt < decayTime) {
      return 0.2 - (0.2 - sustainLevel) * (dt / decayTime);
    }
    // Sustain
    return sustainLevel;
  }

  // ---- Filter swing: rhythmic cutoff modulation ----
  // Swing modulates filter cutoff/resonance, NOT step timing.
  // Creates a "breathing" wah feel without grid drift.
  computeSwingCutoff(stepIndex) {
    const evenFactor = 1.0 - this.swingAmount * 0.7;
    const oddFactor  = 1.0 + this.swingAmount * 1.0;

    // Odd steps open brighter, even steps close darker
    const factor = (stepIndex % 2 === 0) ? evenFactor : oddFactor;

    // Also modulate resonance: higher swing = higher Q on odd steps
    const q = 1.0 + this.swingAmount * 3.0 * ((stepIndex % 2 === 0) ? 0 : 1);

    return {
      cutoff: this.baseFilterCutoff * factor,
      q: q,
    };
  }

  // ---- Per-step voice scheduling ----
  processStep(stepIndex) {
    const currentRows = this.grid[stepIndex];

    for (let row = 0; row < 6; row++) {
      const wasActive   = this.prevGridRows.has(row);
      const nowActive   = currentRows.has(row);

      if (nowActive && !wasActive) {
        // Trigger: new note starts this step
        this.voiceActive[row] = 1;
        this.voiceReleasing[row] = 0;
        this.voiceStartSample[row] = 0;
        this.phases[row] = 0;
      } else if (!nowActive && wasActive) {
        // Release: note was playing, no longer in grid
        this.voiceActive[row] = 0;
        this.voiceReleasing[row] = 1;
        this.voiceStartSample[row] = 0;
      }
      // else: unchanged (still active, or still idle) — do nothing
    }

    this.prevGridRows = new Set(currentRows);
  }

  // ---- Main process loop ----
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const left  = output[0];
    const right = output[1];
    const blockLen = left.length;
    const sr = this.sampleRate;

    // Step duration in samples (1 step = 1/16 bar = 16th note)
    const stepDur = (60.0 / this.bpm) / 4 * sr;

    // Cursor step change tracking (avoids spam inside sample loop)
    let stepJustChanged = false;

    for (let i = 0; i < blockLen; i++) {
      // ---- Step advancement (sample-accurate) ----
      if (this.isPlaying) {
        this.samplesSinceStepStart++;

        if (this.samplesSinceStepStart >= stepDur) {
          this.samplesSinceStepStart -= stepDur;
          this.currentStep = (this.currentStep + 1) % 16;
          this.processStep(this.currentStep);
          stepJustChanged = true;
        }
      }

      // ---- Filter swing: smooth cutoff + Q transition ----
      const swingResult = this.computeSwingCutoff(this.currentStep);
      this.targetCutoff = swingResult.cutoff;
      const targetQ = swingResult.q;

       // Continuous LFO breathing modulation
      this.lfoPhase += this.lfoSpeed / sr;
      if (this.lfoPhase >= 1.0) this.lfoPhase -= 1.0;
      const lfoValue = 0.5 + 0.5 * Math.sin(2 * Math.PI * this.lfoPhase);

       // Per-sample smoothing for cutoff (fast enough to track rhythm, slow enough to be smooth)
      const cutoffSmoothing = 0.06;
      const breathMod = lfoValue * (1 - lfoValue) * 0.5;
      this.currentCutoff += (this.targetCutoff * (1 + breathMod) - this.currentCutoff) * cutoffSmoothing;

      // Interpolate Q (stored transiently in coefficient calc)
      this.updateFilterCoefficients(this.currentCutoff, targetQ, sr);

      // ---- Voice synthesis: mix all 6 voices ----
      let mix = 0;

      for (let v = 0; v < 6; v++) {
        const alive = this.voiceActive[v] || this.voiceReleasing[v];

        if (!alive) continue;

        // Advance phase
        this.phases[v] += this.scale[v] / sr;
        if (this.phases[v] >= 1.0) this.phases[v] -= 1.0;

        // Increment sample counter for envelope
        this.voiceStartSample[v]++;

        // Compute envelope value
        const env = this.computeEnvelope(
          this.voiceStartSample[v],
          this.voiceReleasing[v]
        );

        if (env > 0) {
          const raw = this.triangleWave(this.phases[v]);
          mix += raw * env;
        }

        // Kill voice after release completes
        if (this.voiceReleasing[v] && env <= 0) {
          this.voiceReleasing[v] = 0;
        }
      }

      // ---- Apply biquad lowpass ----
      const filtered = this.filter_b0 * mix
                       + this.filter_b1 * this.filter_x1
                       + this.filter_b2 * this.filter_x2
                       - this.filter_a1 * this.filter_y1
                       - this.filter_a2 * this.filter_y2;

      this.filter_x2 = this.filter_x1;
      this.filter_x1 = mix;
      this.filter_y2 = this.filter_y1;
      this.filter_y1 = filtered;

       // ---- Soft saturation to prevent hard clipping ----
      let out = filtered;
      if (Math.abs(out) > 1.0) {
        out = (out >= 0 ? 1 : -1) * (1 - Math.exp(1 - Math.abs(out)));
      }

      left[i]  = out;
      right[i] = out;
    }

    // ---- Post-block cursor update (batched, not per-sample) ----
    if (stepJustChanged && this.currentStep !== this.cursorSentStep) {
      this.cursorSentStep = this.currentStep;
      this.messagePort.postMessage({ type: 'CURSOR', step: this.currentStep });
    }

    return true;
  }
}

registerProcessor('pentatonic-worklet', PentatonicWorklet);
