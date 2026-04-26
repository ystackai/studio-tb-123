class PentatonicWorklet extends AudioWorkletProcessor {
  constructor() {
    super();

    // -- Timing state --
    this.bpm = 140;
    this.currentStep = 0;
    this.isPlaying = false;
    this.stepPhase = 0;
    this.samplesSinceStepStart = 0;

     // -- DSP parameters --
     this.swingAmount = 0.30;
     this.baseFilterCutoff = 2000;
     this.filterQ = 4;
     this.waveform = 'triangle';
     this.lfoMeasureCycle = 4;
     this.deepLfoMeasureCycle = 8;
     this.lfoAmplitude = 0.3;
     this.deepLfoAmplitude = 0.15;

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
      // Secondary deep-swell LFO: 8-measure loop for slow undulation
    this.deepLfoPhase = 0;

      // -- Cursor --
     this.cursorSentStep = -1;
      // -- LFO position feedback --
     this.lfoSentSample = 0;
     this.lastLfoPost = -1;

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
          this.filterDirty = true;
          break;
        case 'SET_FILTER':
          this.baseFilterCutoff = m.value;
          this.filterDirty = true;
          break;
        case 'SET_RESONANCE':
          this.filterQ = m.value;
          this.filterDirty = true;
          break;
        case 'SET_WAVEFORM':
          this.waveform = m.value;
          break;
        case 'SET_LFO_RATE':
          this.lfoMeasureCycle = m.value;
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
          this.stepPhase = 0;
          this.lfoPhase = 0;
          this.deepLfoPhase = 0;
          this.prevGridRows.clear();
          this.voiceActive.fill(0);
          this.voiceReleasing.fill(0);
          this.voiceStartSample.fill(0);
          this.phases.fill(0);
          this.crossfade = 0;
          this.targetCrossfade = 0;
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
      // Odd-step cutoff pushes higher by swing amount for wah/groove effect
     const oddCut   = this.baseFilterCutoff * (1 + this.swingAmount * 1.2);
      // Resonance also breathes with swing: higher Q on odd steps
     const evenQ = this.filterQ;
     const oddQ  = this.filterQ * (1 + this.swingAmount * 0.5);

     this.setBiquadCoeffs('fA', evenCut, evenQ, sr);
     this.setBiquadCoeffs('fB', oddCut, oddQ, sr);
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
     let v = 4 * Math.abs(phase - 0.5) - 1;
     // Subtle 2nd harmonic for warmth (pentatonic stays musical)
     return v + 0.15 * Math.sin(2 * 2 * Math.PI * phase);
    }

    // ---- ADSR envelope ----
    // Fast attack, long decay, breathing sustain, smooth release
   computeEnvelope(sinceTrigger, releasing) {
    const atk = 0.004;
    const dcy = 0.14;
    const sus = 0.35;
    const rel = 0.28;

    const t = sinceTrigger / this.sampleRate;

    if (releasing) {
      if (t < rel) {
        const frac = t / rel;
        const linear = sus * (1 - frac);
        return linear * linear * (3 - 2 * linear); // smoothstep release
       }
      return 0;
     }

    if (t < atk) return t / atk;

    const dt = t - atk;
    if (dt < dcy) return 1 - (1 - sus) * (dt / dcy);

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
     const out   = outputs[0];
     const left  = out[0];
     const right  = out[1];
     const N     = left.length;
     const sr    = this.sampleRate;

     // Recompute filter coefficients only when params change
     if (this.filterDirty) this.recalcFilters();

     // Step duration = 16th note at current BPM
     const stepDur = (60 / this.bpm) / 4 * sr;

     // LFO: 1 cycle per 4 measures (4 * 16 = 64 steps)
     const lfoPerSample = 1 / (64 * stepDur);

     // Fast local refs for step tracking
     let stepChanged = false;
     let newStep = -1;

      for (let i = 0; i < N; i++) {
         // -- Sample-accurate step advance via float accumulator --
        if (this.isPlaying) {
          this.stepPhase += 1;

          if (this.stepPhase >= stepDur) {
            this.stepPhase -= stepDur;
            this.currentStep = (this.currentStep + 1) % 16;
            this.processStep(this.currentStep);
            newStep = this.currentStep;
            stepChanged = true;
           }
         }

        // -- Crossfade target: step-dependent swing --
        // Even steps lean toward filter A (darker), odd toward filter B (brighter)
        this.targetCrossfade = (this.currentStep % 2 === 0)
           ? 0
           : this.swingAmount;

         // Smooth crossfade with asymmetric speed for organic feel
        // Attack (opening filter) is faster than release (closing)
        const isAttacking = this.targetCrossfade > this.crossfade;
        const fadeSpeed = isAttacking ? 0.18 : 0.06;
        this.crossfade += (this.targetCrossfade - this.crossfade) * fadeSpeed;

          // -- LFO breath: continuous undulation on top of step swing --
         this.lfoPhase += lfoPerSample;
         if (this.lfoPhase > 1) this.lfoPhase -= 1;
         const lfo = 0.5 + 0.5 * Math.sin(2 * Math.PI * this.lfoPhase);

          // Deep LFO: 8-measure cycle for slow, broad "breathing" swell
         this.deepLfoPhase += lfoPerSample / 2; // half speed = 8 measures
         if (this.deepLfoPhase > 1) this.deepLfoPhase -= 1;
         const deepLfo = 0.5 + 0.5 * Math.sin(2 * Math.PI * this.deepLfoPhase);

           // LFO modulates blend toward the brighter filter on its peak
         const lfoShift = (lfo - 0.5) * 0.3 * this.swingAmount;
         // Deep modulation adds a broad undulation to the entire filter sweep
         const deepShift = (deepLfo - 0.5) * 0.15 * this.swingAmount;
         const blend = Math.min(1, Math.max(0, this.crossfade + lfoShift + deepShift));

         // -- Voice synthesis: sum all active voices --
        let mix = 0;

        for (let v = 0; v < 6; v++) {
          if (!this.voiceActive[v] && !this.voiceReleasing[v]) continue;

          // Phase advance (sample-accurate)
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

         // -- Dual parallel filter chain with crossfade --
        // Each filter maintains its own state, no discontinuities
        const yA = this.runFilter('fA', mix);
        const yB = this.runFilter('fB', mix);
        let sample = yA * (1 - blend) + yB * blend;

           // -- Soft clipping for clean output --
         const abs = Math.abs(sample);
         if (abs > 1.2) {
           sample = (sample < 0 ? -1 : 1) * (1 - Math.exp(1.2 - abs));
          }

            // -- Write stereo output — master gain 0.85, slight spread --
          left[i]    = sample * 0.85;
          right[i]   = sample * 0.78;
        }

        // -- Post-block: cursor step update (batched per audio block) --
      if (stepChanged && newStep !== this.cursorSentStep) {
        this.cursorSentStep = newStep;
        this.messagePort.postMessage({ type: 'CURSOR', step: newStep });
        }

      return true;
      }
}

registerProcessor('pentatonic-worklet', PentatonicWorklet);
