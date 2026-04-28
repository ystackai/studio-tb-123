'use strict';

/* ─── Open Circuit Synthesizer Engine ───
   Web Audio API synth with 4x8 grid, major-chord patch,
   signal chain (Filter→Decay→VCA), soft-clamp saturation,
   visual amplitude routing to VCA pre-delay.
*/

// ─── Constants ───
const COLS = 8;
const ROWS = 4;
const GRID_CANVAS_ID = 'grid-canvas';
const VIZ_CANVAS_ID = 'visualizer-canvas';

// Major chord base frequencies (C major across 4 octaves)
const CHORD_FREQS = [
  261.63,   // C4
  329.63,   // E4
  392.00,   // G4
  523.25,   // C5
];

// 8-note C major scale multipliers (equal-tempered)
const SCALE_MULTIPLIERS = [
   1.0,         // C  (unison)
   Math.pow(2, 2/12),      // D  (major 2nd)
   Math.pow(2, 4/12),      // E  (major 3rd)
   Math.pow(2, 5/12),      // F  (perfect 4th)
   Math.pow(2, 7/12),      // G  (perfect 5th)
   Math.pow(2, 9/12),      // A  (major 6th)
   Math.pow(2, 11/12),     // B  (major 7th)
   Math.pow(2, 12/12),     // C  (octave)
];

// ─── Audio Engine ───
class SynthAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.analyser = null;
    this.analyserNode = null;
    this.softClampNode = null;
    this._params = {
      cutoff: 4000,
      decay: 1.2,
      vcaPredelay: 10,
    };
    this._activeVoices = new Map();
    this._gridStates = new Array(COLS * ROWS).fill(false);
    this._amplitudeValues = new Array(COLS * ROWS).fill(0);
    this._onAmplitude = null;
    this._onGridVisual = null;
    this._initialized = false;
  }

  async init() {
    if (this._initialized) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)({
      latencyHint: 'interactive',
    });
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    // Signal chain: Voices → Soft-Clamp → Filter → MasterGain → Analyser → Destination
    this._buildSignalChain();
    this._initialized = true;
  }

  _buildSignalChain() {
    // Soft-clamp worklet processor
    this.softClampNode = this.ctx.createScriptProcessor(1024, 1, 1);
    this.softClampNode.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const output = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < input.length; i++) {
        const x = input[i];
        // Soft-clamp saturation: tanh-based limiting
        output[i] = this._softClamp(x * 2.5);
      }
    };

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.7;

    this.analyser = this.ctx.createBiquadFilter();
    this.analyser.type = 'lowpass';
    this.analyser.frequency.value = this._params.cutoff;
    this.analyser.Q.value = 2.0; // Resonant filter

    this.analyserNode = this.ctx.createAnalyser();
    this.analyserNode.fftSize = 2048;
    this.analyserNode.smoothingTimeConstant = 0.82;

    this.softClampNode.connect(this.analyser);
    this.analyser.connect(this.masterGain);
    this.masterGain.connect(this.analyserNode);
    this.analyserNode.connect(this.ctx.destination);
  }

  _softClamp(x) {
    // Smooth tanh with soft-knee transition
    const knee = 0.8;
    if (Math.abs(x) < knee) {
      return x;
    }
    return knee * Math.tanh(x / knee);
  }

  setParam(name, value) {
    this._params[name] = value;
    if (name === 'cutoff' && this.analyser) {
      this.analyser.frequency.setTargetAtTime(value, this.ctx.currentTime, 0.02);
    }
  }

  getParam(name) {
    return this._params[name];
  }

  triggerCell(col, row) {
    if (!this._initialized) return;
    const now = this.ctx.currentTime;
    const baseFreq = CHORD_FREQS[row];
    const freq = baseFreq * SCALE_MULTIPLIERS[col];

    const voiceId = `${row}-${col}`;

    // Cancel existing voice for this cell
    if (this._activeVoices.has(voiceId)) {
      this._releaseVoice(voiceId);
    }

    const envelopeDur = Math.max(0.1, this._params.decay);
    const preDelay = Math.max(0, this._params.vcaPredelay / 1000);

    // VCO
    const osc = this.ctx.createOscillator();
    // Use a triangle wave for warm tone
    osc.type = 'triangle';
    osc.frequency.value = freq;

    // Soft-knee VCO: slight frequency modulation for warmth
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.3 + Math.random() * 0.2;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = freq * 0.001;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    // VCA / envelope
    const vca = this.ctx.createGain();
    vca.gain.value = 0;
    // Fast attack, controlled pre-delay
    vca.gain.setValueAtTime(0, now + preDelay);
    vca.gain.linearRampToValueAtTime(0.55, now + preDelay + 0.003);
    // Smooth exponential release
    vca.gain.setTargetAtTime(0, now + preDelay + 0.003, envelopeDur * 0.33);

    osc.connect(vca);
    vca.connect(this.softClampNode);

    osc.start(now + preDelay);
    lfo.start(now + preDelay);

    const voice = { osc, lfo, vca, startTime: now, col, row };
    this._activeVoices.set(voiceId, voice);

    // Schedule voice cleanup
    this._scheduleRelease(voiceId, now + preDelay + envelopeDur * 3);

    // Visual signal
    this._gridStates[ROW * col + row] = true;
    this._amplitudeValues[ROW * col + row] = 0.6;
    if (this._onGridVisual) this._onGridVisual(col, row);
    if (this._onAmplitude) this._onAmplitude(col, row, 0.6);
  }

  _releaseVoice(voiceId) {
    const v = this._activeVoices.get(voiceId);
    if (!v) return;
    const now = this.ctx.currentTime;
    if (v.vca) {
      v.vca.gain.cancelScheduledValues(now);
      v.vca.gain.value = 0;
    }
    try { v.osc.stop(now + 0.01); } catch (_) {}
    try { v.lfo.stop(now + 0.01); } catch (_) {}
    this._activeVoices.delete(voiceId);
    // Reset grid state
    const idx = v.col * ROWS + v.row;
    this._gridStates[idx] = false;
    this._amplitudeValues[idx] = 0;
  }

  _scheduleRelease(voiceId, releaseTime) {
    setTimeout(() => {
      this._releaseVoice(voiceId);
    }, (releaseTime - this.ctx.currentTime) * 1000 + 50);
  }

  getAmplitudeData() {
    if (!this.analyserNode) return new Float32Array(0);
    const data = new Float32Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteTimeDomainData(data);
    return data;
  }

  getMagnitude() {
    if (!this.analyserNode) return 0;
    const bufferLength = this.analyserNode.frequencyBinCount;
    const data = new Uint8Array(bufferLength);
    this.analyserNode.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const x = (data[i] - 128) / 128;
      sum += x * x;
    }
    return Math.sqrt(sum / bufferLength);
  }

  stopAll() {
    for (const [id] of this._activeVoices) {
      this._releaseVoice(id);
    }
  }
}

// ─── Grid Renderer ───
class GridRenderer {
  constructor(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.cellStates = new Array(COLS * ROWS).fill(false);
    this.cellAmplitudes = new Array(COLS * ROWS).fill(0);
    this.cellGlows = new Array(COLS * ROWS).fill(0);
    this.dpr = window.devicePixelRatio || 1;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.dpr = window.devicePixelRatio || 1;
    const container = this.canvas.parentElement;
    const maxW = Math.min(container.clientWidth, 560);
    this.cellW = maxW / COLS;
    this.cellH = (this.cellW * 1.2);
    const w = COLS * this.cellW;
    const h = ROWS * this.cellH;
    this.canvas.width = w * this.dpr;
    this.canvas.height = h * this.dpr;
    this.canvas.style.width = Math.round(w) + 'px';
    this.canvas.style.height = Math.round(h) + 'px';
    this.ctx.scale(this.dpr, this.dpr);
  }

  update(states, amplitudes) {
    for (let i = 0; i < COLS * ROWS; i++) {
      this.cellStates[i] = states[i];
      this.cellAmplitudes[i] = amplitudes[i];
    }
  }

  draw(filterSweepIntensity) {
    const ctx = this.ctx;
    const w = this.canvas.width / this.dpr;
    const h = this.canvas.height / this.dpr;

    // Background
    ctx.fillStyle = '#08080a';
    ctx.fillRect(0, 0, w, h);

    // Update glows with decay
    for (let i = 0; i < this.cellGlows.length; i++) {
      this.cellGlows[i] += (this.cellAmplitudes[i] - this.cellGlows[i]) * 0.15;
    }

    this.drawCells(ctx, filterSweepIntensity);
    this.drawGridLines(ctx);
  }

  drawCells(ctx, filterSweep) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const idx = c * ROWS + r;
        const x = c * this.cellW;
        const y = r * this.cellH;
        const glow = this.cellGlows[idx];
        const activated = this.cellStates[idx];

        // Apply filter sweep distortion
        const distX = Math.sin(c * 0.7 + filterSweep * 3.0) * 2 * filterSweep;
        const distY = Math.cos(r * 0.5 + filterSweep * 2.0) * 1.5 * filterSweep;
        const cx = x + this.cellW / 2 + distX;
        const cy = y + this.cellH / 2 + distY;

        // Cell background
        const baseAlpha = activated ? 0.12 + glow * 0.35 : 0.03 + glow * 0.15;
        const red = Math.round(230 * (glow + 0.02));
        const green = Math.round(57 * (glow + 0.02));
        const blue = Math.round(70 * (glow + 0.02));
        ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${baseAlpha})`;
        ctx.fillRect(x + 2, y + 2, this.cellW - 4, this.cellH - 4);

        // Glow overlay
        if (glow > 0.05) {
          const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, this.cellW * 0.75);
          grad.addColorStop(0, `rgba(230, 57, 70, ${glow * 0.5})`);
          grad.addColorStop(1, 'rgba(230, 57, 70, 0)');
          ctx.fillStyle = grad;
          ctx.fillRect(x, y, this.cellW, this.cellH);

          // Amplitude pulse ring
          ctx.beginPath();
          ctx.arc(cx, cy, 4 + glow * 14 * this.cellW / this.cellW, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(230, 57, 70, ${glow * 0.6})`;
          ctx.lineWidth = Math.max(1, glow * 3);
          ctx.stroke();
        }
      }
    }
  }

  drawGridLines(ctx) {
    ctx.strokeStyle = '#1e2030';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let c = 0; c <= COLS; c++) {
      const x = c * this.cellW;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ROWS * this.cellH);
      ctx.stroke();
    }

    // Horizontal lines
    for (let r = 0; r <= ROWS; r++) {
      const y = r * this.cellH;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(COLS * this.cellW, y);
      ctx.stroke();
    }
  }
}

// ─── Visualizer ───
class Visualizer {
  constructor(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this._amplitude = 0;
    this._prevAmplitude = 0;
  }

  resize() {
    this.dpr = window.devicePixelRatio || 1;
    const container = this.canvas.parentElement;
    const w = container.clientWidth;
    const h = container.clientHeight;
    this.canvas.width = w * this.dpr;
    this.canvas.height = h * this.dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.scale(this.dpr, this.dpr);
    this.w = w;
    this.h = h;
  }

  amplitudeChanged(value) {
    this._prevAmplitude = this._amplitude;
    this._amplitude = Math.max(this._amplitude, value);
  }

  draw(waveformData) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(6, 6, 8, 0.85)';
    ctx.fillRect(0, 0, this.w, this.h);

    // Decay amplitude
    this._amplitude *= 0.96;

    // Amplitude pre-delay overlay bar
    if (this._amplitude > 0.01) {
      const barH = this._amplitude * this.h * 0.4;
      const barY = this.h / 2 - barH / 2;
      ctx.fillStyle = `rgba(230, 57, 70, ${this._amplitude * 0.4})`;
      ctx.fillRect(0, barY, this.w, barH);
    }

    // Waveform
    if (waveformData && waveformData.length > 0) {
      ctx.beginPath();
      const sliceW = this.w / waveformData.length;
      let x = 0;
      for (let i = 0; i < waveformData.length; i++) {
        const v = (waveformData[i] - 128) / 128;
        const y = this.h / 2 + v * this.h * 0.4;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceW;
      }
      ctx.strokeStyle = '#e63946';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'rgba(230, 57, 70, 0.5)';
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }
}

// ─── Knob Controller ───
 class KnobController {
  constructor(element, synth, onValuesChange) {
    this.el = element;
    this._indicator = element.querySelector('.knob-indicator');
    this.synth = synth;
    this.onValuesChange = onValuesChange;
    this.paramName = element.dataset.param;
    this.min = parseFloat(element.dataset.min);
    this.max = parseFloat(element.dataset.max);
    this.value = parseFloat(element.dataset.value);
    this._isDragging = false;
    this._startY = 0;
    this._startValue = 0;

    this.el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this._isDragging = true;
      this._startY = e.clientY;
      this._startValue = this.value;
      this.el.setPointerCapture(e.pointerId);
    });

    window.addEventListener('pointermove', (e) => {
      if (!this._isDragging) return;
      const dy = this._startY - e.clientY;
      const range = this.max - this.min;
      this.value = this._startValue + (dy / 200) * range;
      this.value = Math.max(this.min, Math.min(this.max, this.value));
      this._updateVisual();
      this._updateDisplay();
      this.synth.setParam(this.paramName, this.value);
    });

    window.addEventListener('pointerup', () => {
      this._isDragging = false;
    });

    this._updateVisual();
  }

    _updateVisual() {
    const pct = (this.value - this.min) / (this.max - this.min);
    const angle = -135 + pct * 270;
    if (this._indicator) {
      this._indicator.style.transform = `translateX(-50%) rotate(${angle}deg)`;
     }
   }

  _updateDisplay() {
    const displayElId = {
      cutoff: 'cutoff-display',
      decay: 'decay-display',
      vcapredelay: 'vcapredelay-display',
    }[this.paramName];

    const el = document.getElementById(displayElId);
    if (!el) return;

    if (this.paramName === 'cutoff') {
      el.textContent = Math.round(this.value) + ' Hz';
    } else if (this.paramName === 'decay') {
      el.textContent = this.value.toFixed(1) + 's';
    } else if (this.paramName === 'vcapredelay') {
      el.textContent = Math.round(this.value) + 'ms';
    }
  }
}

// ─── App ───
class App {
  constructor() {
    this.synth = new SynthAudioEngine();
    this.gridRenderer = null;
    this.visualizer = null;
    this.gridStates = new Array(COLS * ROWS).fill(false);
    this.amplitudes = new Array(COLS * ROWS).fill(0);
    this.filterSweep = 0;
    this.knobs = [];
  }

  async start() {
    // Build grid canvas
    const gridCanvas = document.getElementById(GRID_CANVAS_ID);
    this.gridRenderer = new GridRenderer(gridCanvas);

    // Build visualizer canvas
    const vizCanvas = document.getElementById(VIZ_CANVAS_ID);
    this.visualizer = new Visualizer(vizCanvas);

    // Knobs
    this.knobs.push(new KnobController(document.getElementById('filter-cutoff'), this.synth, () => this._onKnobChange()));
    this.knobs.push(new KnobController(document.getElementById('decay'), this.synth, () => this._onKnobChange()));
    this.knobs.push(new KnobController(document.getElementById('vcapredelay'), this.synth, () => this._onKnobChange()));

    // Init audio on first interaction
    const audioInitPromise = new Promise((resolve) => {
      const tryInit = () => {
        this.synth.init().then(() => {
          resolve();
          document.removeEventListener('click', tryInit);
          document.removeEventListener('touchstart', tryInit);
        }).catch(() => {});
      };
      document.addEventListener('click', tryInit, { once: true });
      document.addEventListener('touchstart', tryInit, { once: true });
    });

    // Grid interaction
    this._setupGridInteraction(gridCanvas);

    await audioInitPromise;

    // Callbacks
    this.synth._onGridVisual = (col, row) => this._onCellTriggered(col, row);
    this.synth._onAmplitude = (col, row, amp) => this._onAmplitudeChange(col, row, amp);

    startRendering();
  }

  _setupGridInteraction(canvas) {
    let isDown = false;
    let hoveredCell = null;

    const getCellFromEvent = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const col = Math.floor(x / (rect.width / COLS));
      const row = Math.floor(y / (rect.height / ROWS));
      if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
        return { col, row };
      }
      return null;
    };

    const triggerCell = (cell) => {
      if (!cell) return;
      this.synth.triggerCell(cell.col, cell.row);
    };

    canvas.addEventListener('pointerdown', (e) => {
      isDown = true;
      const cell = getCellFromEvent(e);
      triggerCell(cell);
    });

    canvas.addEventListener('pointermove', (e) => {
      const cell = getCellFromEvent(e);
      if (isDown && cell) {
        triggerCell(cell);
      }
      hoveredCell = cell;
    });

    canvas.addEventListener('pointerup', () => {
      isDown = false;
    });

    canvas.addEventListener('pointerleave', () => {
      isDown = false;
      hoveredCell = null;
    });

    // Hover visual feedback
    canvas.addEventListener('mousemove', () => {
      canvas.style.cursor = (hoveredCell) ? 'pointer' : 'default';
    });
  }

  _onCellTriggered(col, row) {
    const idx = col * ROWS + row;
    this.gridStates[idx] = true;
    this.filterSweep = 0.8;
  }

  _onAmplitudeChange(col, row, amp) {
    const idx = col * ROWS + row;
    this.amplitudes[idx] = Math.max(this.amplitudes[idx], amp);
    this.visualizer.amplitudeChanged(amp);

    // Visual amplitude overlay
    const overlay = document.getElementById('amplitude-overlay');
    if (overlay) {
      overlay.style.opacity = Math.min(amp * 0.3, 0.15);
    }
  }

  _onKnobChange() {
    // Could add visual feedback here
  }
}

// ─── Render Loop ───
let appInstance = null;

function startRendering() {
  const frame = () => {
    if (!appInstance) {
      requestAnimationFrame(frame);
      return;
    }

    const viz = appInstance.visualizer;
    const renderer = appInstance.gridRenderer;
    const synth = appInstance.synth;

    // Decay amplitudes
    for (let i = 0; i < appInstance.amplitudes.length; i++) {
      appInstance.amplitudes[i] *= 0.94;
      if (appInstance.amplitudes[i] < 0.005) {
        appInstance.amplitudes[i] = 0;
        appInstance.gridStates[i] = false;
      }
    }

    // Decay filter sweep
    appInstance.filterSweep *= 0.93;

    // Waveform data
    let waveformData = null;
    try {
      if (synth.analyserNode) {
        const buf = new Uint8Array(synth.analyserNode.fftSize);
        synth.analyserNode.getByteTimeDomainData(buf);
        waveformData = buf;
      }
    } catch (_) {}

    viz.draw(waveformData);
    renderer.update(appInstance.gridStates, appInstance.amplitudes);
    renderer.draw(appInstance.filterSweep);

    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
}

// ─── Entry ───
document.addEventListener('DOMContentLoaded', () => {
  appInstance = new App();
  appInstance.start();
});
