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
    this.filterQ = 4;

    // -- Grid: 16 steps, each a Set of active row indices --
    this.grid = new Array(16).fill(null).map(() => new Set());

    // -- Pentatonic C minor scale (C4 top, C5 bottom) --
    this.scale = [
      523.25,
      440.00,
      392.00,
      329.63,
      293.66,
      261.63,
    ];

    // -- Voice state: one voice per scale degree --
    this.phases = new Float32Array(6);
    this.voiceActive = new Int8Array(6);
    this.voiceReleasing = new Int8Array(6);
    this.voiceStartSample = new Float32Array(6);
    this.prevGridRows = new Set();

    // -- Dual parallel filter state for smooth crossfade --
    // Filter A (even steps / baseline)
    this.fA_b0 = 0; this.fA_b1 = 0; this.fA_b2 = 0;
    this.fA_a1 = 0; this.fA_a2 = 0;
    this.fA_x1 = 0; this.fA_x2 = 0;
    this.fA_y1 = 0; this.fA_y2 = 0;

    // Filter B (odd steps / swing)
    this.fB_b0 = 0; this.fB_b1 = 0; this.fB_b2 = 0;
    this.fB_a1 = 0; this.fB_a2 = 0;
    this.fB_x1 = 0; this.fB_x2 = 0;
    this.fB_y1 = 0; this.fB_y2 = 0;

    // Crossfade blend (0 = all A, 1 = all B)
    this.crossfade = 0;
    this.targetCrossfade = 0;

    // -- LFO breath --
    // Cycles over 4 measures so it feels organic, not mechanical
    this.lfoPhase = 0;

    // -- Cursor --
    this.cursorSentStep = -1;

    // -- Coefficient dirty flag --
    this.filterDirty = true;

    // -- Message handling --
    this.messagePort.onmessage = (e) => {
      const m = e.data;
      switch (m.type) {
        case 'SET_BPM':
          this.bpm = m.value;
          break;
        case 'SET_SWING':
          this.swingAmount = m.value / 100;
          break;
        case 'SET_FILTER':
          this.baseFilterCutoff = m.value;
          this.filterDirty = true;
          break;
        case 'SET_GRID': {
          for (let s = 0; s < 16; s++) {
            this.grid[s] = new Set(m.grid[s] || []);
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
          // Trigger step-0 notes immediately so there's no dead step at startup
          this.processStep(0);
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

    // Boot initial coefficients
    this.recalcFilters();
  }

  // ---- Recompute both filter coefficient sets ----
  recalcFilters() {
    const sr = this.sampleRate;
    const evenCut = this.baseFilterCutoff;
    // Odd-step cutoff pushes higher by swing amount for wah effect
    const oddCut  = this.baseFilterCutoff * (1 + this.swingAmount * 0.8);

    this.setBiquadCoeffs('fA', evenCut, this.filterQ, sr);
    this.setBiquadCoeffs('fB', oddCut, this.filterQ, sr);
    this.filterDirty = false;
  }

  // ---- Set biquad lowpass coefficients for a named filter pair (fA or fB) ----
  setBiquadCoeffs(prefix, cutoffHz, q, sr) {
    const w  = 2 * Math.PI * cutoffHz / sr;
    const sw = Math.sin(w);
    const cw = Math.cos(w);
    const alpha = sw / (2 * q);

    const b0 = (1 - cw) / 2;
    const b1 = 1 - cw;
    const b2 = (1 - cw) / 2;
    const a0 = 1 + alpha;
    const a1 = -2 * cw;
    const a2 = 1 - alpha;

    // Direct Form II Transposed coefficients (divided by a0)
    this[prefix + '_b0'] = b0 / a0;
    this[prefix + '_b1'] = b1 / a0;
    this[prefix + '_b2'] = b2 / a0;
    this[prefix + '_a1'] = a1 / a0;
    this[prefix + '_a2'] = a2 / a0;
  }

  // ---- Run one filter stage, return output sample ----
  runFilter(prefix, x) {
    const y = this[prefix + '_b0'] * x
            +  this[prefix + '_b1'] * this[prefix + '_x1']
            +  this[prefix + '_b2'] * this[prefix + '_x2']
            -  this[prefix + '_a1'] * this[prefix + '_y1']
            -  this[prefix + '_a2'] * this[prefix + '_y2'];

    this[prefix + '_x2'] = this[prefix + '_x1'];
    this[prefix + '_x1'] = x;
    this[prefix + '_y2'] = this[prefix + '_y1'];
    this[prefix + '_y1'] = y;

    return y;
  }

  // ---- Triangle oscillator ----
  triangleWave(phase) {
    return 4 * Math.abs(phase - 0.5) - 1;
  }

  // ---- ADSR envelope ----
  computeEnvelope(sinceTrigger, releasing) {
    const atk = 0.008;
    const dcy = 0.06;
    const sus = 0.15;
    const rel = 0.18;

    const t = sinceTrigger / this.sampleRate;

    if (releasing) {
      return t < rel ? sus * (1 - t / rel) : 0;
    }

    if (t < atk) return 0.25 * (t / atk);

    const dt = t - atk;
    if (dt < dcy) return 0.25 - (0.25 - sus) * (dt / dcy);

    return sus;
  }

  // ---- Per-step voice scheduling ----
  processStep(stepIndex) {
    const currentRows = this.grid[stepIndex];

    for (let row = 0; row < 6; row++) {
      const was = this.prevGridRows.has(row);
      const now = currentRows.has(row);

      if (now && !was) {
        this.voiceActive[row]     = 1;
        this.voiceReleasing[row]  = 0;
        this.voiceStartSample[row] = 0;
        this.phases[row] = 0;
      } else if (!now && was) {
        this.voiceActive[row]     = 0;
        this.voiceReleasing[row]  = 1;
        this.voiceStartSample[row] = 0;
      }
    }

    this.prevGridRows = new Set(currentRows);
  }

  // ---- Main process loop ----
  process(inputs, outputs) {
    const out  = outputs[0];
    const left = out[0];
    const right = out[1];
    const N    = left.length;
    const sr   = this.sampleRate;

    // Recompute filter coefficients only when params change
    if (this.filterDirty) this.recalcFilters();

    // Step duration = 16th note
    const stepDur = (60 / this.bpm) / 4 * sr;

    // LFO: 1 cycle per 4 measures (4 * 16 = 64 steps)
    const lfoSteps = 64;
    const lfoPerSample = (lfoSteps * stepDur / sr) / sr;

    let stepChanged = false;

    for (let i = 0; i < N; i++) {
      // -- Advance step (sample-accurate, drift-compensating) --
      if (this.isPlaying) {
        this.samplesSinceStepStart++;

        if (this.samplesSinceStepStart >= stepDur) {
          this.samplesSinceStepStart -= Math.floor(stepDur);
          // Compensate fractional drift
          const frac = stepDur - Math.floor(stepDur);
          if (this.samplesSinceStepStart < frac) {
            this.samplesSinceStepStart += 1;
          }
          this.currentStep = (this.currentStep + 1) % 16;
          this.processStep(this.currentStep);
          stepChanged = true;
        }
      }

      // -- Crossfade target: step-dependent swing --
      // Even steps lean toward filter A (darker), odd toward filter B (brighter)
      this.targetCrossfade = (this.currentStep % 2 === 0)
        ? 0
        : this.swingAmount;

      // Smooth crossfade (exponential approach)
      const fadeSpeed = 0.12;
      this.crossfade += (this.targetCrossfade - this.crossfade) * fadeSpeed;

      // -- LFO breath: adds continuous undulation on top of swing --
      this.lfoPhase += lfoPerSample;
      if (this.lfoPhase > 1) this.lfoPhase -= 1;
      const lfo = 0.5 + 0.5 * Math.sin(2 * Math.PI * this.lfoPhase);

      // LFO modulates both filters' effective output via crossfade shift
      const lfoShift = (lfo - 0.5) * 0.3 * this.swingAmount;
      const blend = Math.min(1, Math.max(0, this.crossfade + lfoShift));

      // -- Voice synthesizer --
      let mix = 0;

      for (let v = 0; v < 6; v++) {
        if (!this.voiceActive[v] && !this.voiceReleasing[v]) continue;

        // Phase advance
        this.phases[v] += this.scale[v] / sr;
        if (this.phases[v] >= 1) this.phases[v] -= 1;

        this.voiceStartSample[v]++;

        const env = this.computeEnvelope(this.voiceStartSample[v], this.voiceReleasing[v]);

        if (env > 0) {
          mix += this.triangleWave(this.phases[v]) * env;
        }

        if (this.voiceReleasing[v] && env <= 0) {
          this.voiceReleasing[v] = 0;
        }
      }

      // -- Dual parallel filters, crossfaded --
      const yA = this.runFilter('fA', mix);
      const yB = this.runFilter('fB', mix);
      let sample = yA * (1 - blend) + yB * blend;

      // -- Soft clipping --
      const abs = Math.abs(sample);
      if (abs > 1) {
        sample = (sample < 0 ? -1 : 1) * (1 - Math.exp(1 - abs));
      }

      left[i]  = sample;
      right[i] = sample;
    }

    // -- Post-block: cursor update (batched) --
    if (stepChanged && this.currentStep !== this.cursorSentStep) {
      this.cursorSentStep = this.currentStep;
      this.messagePort.postMessage({ type: 'CURSOR', step: this.currentStep });
    }

    return true;
  }
}

registerProcessor('pentatonic-worklet', PentatonicWorklet);
