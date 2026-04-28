(function () {
  "use strict";

  // ─── Config ────────────────────────────────────────────────
  var DEFAULT_CUTOFF = 2000;
  var CUTOFF_MIN = 50;
  var CUTOFF_MAX = 12000;
  var SELF_OSC_THRESHOLD = 0.85;
  var GRID_COLS = 16;
  var GRID_ROWS = 10;
  var CHORD = [261.63, 329.63, 392.00]; // C4 E4 G4

  // ─── State ─────────────────────────────────────────────────
  var audioCtx = null;
  var oscillators = [];
  var filterNode = null;
  var vcaNode = null;
  var analyser = null;
  var softClamp = null;
  var gainNode = null;
  var preDelayNode = null;
  var selfOscOsc = null;
  var selfOscGain = null;
  var engineStarted = false;
  var dragging = false;
  var currentCutoff = DEFAULT_CUTOFF;
  var currentResonance = 5;
  var currentDecay = 0.3;
  var currentGain = 0.5;
  var selfOscActive = false;
  var amplitudeHistory = new Float32Array(64);
  var ampIndex = 0;
  var frameId = null;
  var lastFrameTime = 0;

  // ─── Canvas Setup ──────────────────────────────────────────
  var canvas = document.getElementById("grid-canvas");
  var ctx = canvas.getContext("2d");
  var dpr = window.devicePixelRatio || 1;

  function resizeCanvas() {
    var rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // ─── Audio Engine Initialization ───────────────────────────
  function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)({
      latencyHint: "interactive",
      sampleRate: 48000,
    });

    // Analyser for amplitude routing
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.75;

    // Filter - soft-knee lowpass
    filterNode = audioCtx.createBiquadFilter();
    filterNode.type = "lowpass";
    filterNode.frequency.value = currentCutoff;
    filterNode.Q.value = currentResonance;

    // VCA - gain controlled by amplitude routing
    vcaNode = audioCtx.createGain();
    vcaNode.gain.value = 1;

    // Pre-delay node for VCA envelope shaping
    preDelayNode = audioCtx.createDelay(0.01);
    preDelayNode.delayTime.value = 0.002; // ~2ms pre-delay

    // Soft-clamp using WaveShaper
    softClamp = audioCtx.createWaveShaper();
    softClamp.curve = makeSoftClampCurve();
    softClamp.oversample = "4x";

    // Master output gain
    gainNode = audioCtx.createGain();
    gainNode.gain.value = currentGain;

    // Self-oscillation oscillator (hidden, triggered at threshold)
    selfOscOsc = audioCtx.createOscillator();
    selfOscOsc.type = "triangle";
    selfOscOsc.frequency.value = currentCutoff * 0.5;
    selfOscOsc.stop();

    selfOscGain = audioCtx.createGain();
    selfOscGain.gain.value = 0;

    // Signal chain:
    // VCOs -> Filter -> VCA -> Pre-delay -> Soft-clamp -> Gain -> Analyser -> Output

    // Create oscillators for C major chord
    CHORD.forEach(function (freq) {
      var osc = audioCtx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = freq;

      // Soft-knee compression on individual VCO
      var vcoComp = audioCtx.createDynamicsCompressor();
      vcoComp.threshold.value = -20;
      vcoComp.ratio.value = 4;
      vcoComp.attack.value = 0.001;
      vcoComp.release.value = 0.1;

      osc.connect(vcoComp);
      vcoComp.connect(filterNode);
      osc.start();
      oscillators.push({ osc: osc, compressor: vcoComp });
    });

    // Connect filter -> vca -> pre-delay -> softclamp -> gain -> analyser -> destination
    filterNode.connect(vcaNode);
    vcaNode.connect(preDelayNode);
    preDelayNode.connect(softClamp);
    softClamp.connect(gainNode);
    gainNode.connect(analyser);
    analyser.connect(audioCtx.destination);

    // Self-osc feedback path
    selfOscOsc.connect(selfOscGain);
    selfOscGain.connect(filterNode);

    engineStarted = true;
    updateSelfOscState();
  }

  // ─── Soft-Clamp Curve ──────────────────────────────────────
  function makeSoftClampCurve() {
    var n = 4096;
    var curve = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var x = (i * 2) / (n - 1) - 1;
      // Smooth tanh-based soft clamp
      curve[i] = Math.tanh(x * 2.5);
    }
    return curve;
  }

  // ─── Self-Oscillation Management ───────────────────────────
  function updateSelfOscState() {
    if (!engineStarted) return;

    var wasActive = selfOscActive;
    selfOscActive = currentDecay >= SELF_OSC_THRESHOLD;
    var now = audioCtx.currentTime;

    if (selfOscActive && !wasActive) {
      // Starting self-osc: ramp filter Q up smoothly
      var targetQ = 22 + (currentDecay - SELF_OSC_THRESHOLD) * 80;

      filterNode.frequency.setTargetAtTime(currentCutoff, now, 0.01);
      filterNode.Q.setTargetAtTime(targetQ, now, 0.05);

      // Start self-osc oscillator at filter freq
      if (selfOscOsc) {
        try {
          selfOscOsc.frequency.setTargetAtTime(currentCutoff * 0.95, now, 0.02);
          selfOscGain.gain.setTargetAtTime(0.15 + (currentDecay - SELF_OSC_THRESHOLD) * 3, now, 0.08);
          selfOscOsc.start(now);
        } catch (e) {}
      }

      // VCA boost for self-osc
      vcaNode.gain.setTargetAtTime(1.3, now, 0.03);
    } else if (!selfOscActive && wasActive) {
      // Stopping self-osc: smooth decay
      filterNode.Q.setTargetAtTime(currentResonance, now, 0.1);
      if (selfOscGain) {
        selfOscGain.gain.setTargetAtTime(0, now, 0.15);
      }
      if (selfOscOsc) {
        try {
          selfOscOsc.stop(now + 0.2);
          selfOscOsc = audioCtx.createOscillator();
          selfOscOsc.type = "triangle";
          selfOscOsc.frequency.value = currentCutoff * 0.5;
          selfOscOsc.connect(selfOscGain);
          selfOscGain.connect(filterNode);
        } catch (e) {}
      }
      vcaNode.gain.setTargetAtTime(1, now, 0.05);
    } else if (selfOscActive) {
      // Adjust self-osc intensity while active
      var targetQ = 22 + (currentDecay - SELF_OSC_THRESHOLD) * 80;
      filterNode.Q.setTargetAtTime(targetQ, now, 0.02);
      if (selfOscGain) {
        selfOscGain.gain.setTargetAtTime(
          0.15 + (currentDecay - SELF_OSC_THRESHOLD) * 3,
          now,
          0.02
        );
      }
      if (selfOscOsc) {
        selfOscOsc.frequency.setTargetAtTime(currentCutoff * 0.95, now, 0.01);
      }
    }
  }

  // ─── Amplitude Routing to VCA Pre-Delay ───────────────────
  function updateAmplitudeRouting() {
    if (!analyser || !engineStarted) return;

    var data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);

    // Calculate weighted amplitude from lower frequencies (transient-sensitive)
    var weightedSum = 0;
    var weightCount = 0;
    for (var i = 0; i < data.length; i++) {
      var weight = 1.0 - (i / data.length) * 0.7;
      weightedSum += data[i] * weight;
      weightCount += weight;
    }
    var amplitude = weightCount > 0 ? weightedSum / weightCount / 255 : 0;

    // Store in history ring buffer
    amplitudeHistory[ampIndex % amplitudeHistory.length] = amplitude;
    ampIndex++;

    // VCA pre-delay envelope: attack from transients, hold from avg
    var now = audioCtx.currentTime;
    var avgAmp = 0;
    for (var j = 0; j < amplitudeHistory.length; j++) {
      avgAmp += amplitudeHistory[j];
    }
    avgAmp /= amplitudeHistory.length;

    // Route amplitude to VCA with smooth attack/decay
    var envTarget = 0.5 + amplitude * 0.5;
    vcaNode.gain.setTargetAtTime(envTarget, now, 0.004);

    return amplitude;
  }

  // ─── Grid Interaction ──────────────────────────────────────
  function getGridPos(e) {
    var rect = canvas.getBoundingClientRect();
    var clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  }

  function gridToCutoff(pos) {
    // X-axis maps to cutoff frequency (logarithmic)
    var minLog = Math.log(CUTOFF_MIN);
    var maxLog = Math.log(CUTOFF_MAX);
    return Math.exp(minLog + pos.x * (maxLog - minLog));
  }

  canvas.addEventListener("mousedown", function (e) {
    dragging = true;
    var pos = getGridPos(e);
    currentCutoff = gridToCutoff(pos);
    if (filterNode && engineStarted) {
      filterNode.frequency.setTargetAtTime(
        Math.max(CUTOFF_MIN, Math.min(CUTOFF_MAX, currentCutoff)),
        audioCtx.currentTime,
        0.004
      );
    }
    syncCutoffSlider();
    updateSelfOscState();
  });

  canvas.addEventListener("mousemove", function (e) {
    if (!dragging) return;
    var pos = getGridPos(e);
    currentCutoff = gridToCutoff(pos);
    if (filterNode && engineStarted) {
      filterNode.frequency.setTargetAtTime(
        Math.max(CUTOFF_MIN, Math.min(CUTOFF_MAX, currentCutoff)),
        audioCtx.currentTime,
        0.004
      );
    }
    syncCutoffSlider();
    updateSelfOscState();
  });

  window.addEventListener("mouseup", function () {
    dragging = false;
  });

  // Touch support
  canvas.addEventListener("touchstart", function (e) {
    e.preventDefault();
    dragging = true;
    var pos = getGridPos(e);
    currentCutoff = gridToCutoff(pos);
    if (filterNode && engineStarted) {
      filterNode.frequency.setTargetAtTime(
        Math.max(CUTOFF_MIN, Math.min(CUTOFF_MAX, currentCutoff)),
        audioCtx.currentTime,
        0.004
      );
    }
    syncCutoffSlider();
    updateSelfOscState();
  });

  canvas.addEventListener("touchmove", function (e) {
    e.preventDefault();
    if (!dragging) return;
    var pos = getGridPos(e);
    currentCutoff = gridToCutoff(pos);
    if (filterNode && engineStarted) {
      filterNode.frequency.setTargetAtTime(
        Math.max(CUTOFF_MIN, Math.min(CUTOFF_MAX, currentCutoff)),
        audioCtx.currentTime,
        0.004
      );
    }
    syncCutoffSlider();
    updateSelfOscState();
  });

  window.addEventListener("touchend", function () {
    dragging = false;
  });

  function syncCutoffSlider() {
    var slider = document.getElementById("cutoff-slider");
    if (slider) slider.value = Math.round(currentCutoff);
    updateDisplays();
  }

  // ─── UI Controls ───────────────────────────────────────────
  document.getElementById("start-btn").addEventListener("click", function () {
    if (!engineStarted) {
      initAudio();
      this.textContent = "Restart Audio Engine";
      startRenderLoop();
    } else {
      // Restart
      if (audioCtx) audioCtx.close();
      audioCtx = null;
      oscillators = [];
      engineStarted = false;
      this.textContent = "Start Audio Engine";
      setTimeout(function () {
        initAudio();
        document.getElementById("start-btn").textContent = "Restart Audio Engine";
      }, 100);
    }
  });

  document.getElementById("cutoff-slider").addEventListener("input", function () {
    currentCutoff = parseFloat(this.value);
    if (filterNode && engineStarted) {
      filterNode.frequency.setTargetAtTime(currentCutoff, audioCtx.currentTime, 0.004);
    }
    updateSelfOscState();
    updateDisplays();
  });

  document.getElementById("resonance-slider").addEventListener("input", function () {
    currentResonance = parseFloat(this.value);
    if (filterNode && engineStarted && !selfOscActive) {
      filterNode.Q.setTargetAtTime(currentResonance, audioCtx.currentTime, 0.01);
    }
    updateDisplays();
  });

  document.getElementById("decay-slider").addEventListener("input", function () {
    currentDecay = parseFloat(this.value);
    updateSelfOscState();
    updateDisplays();
  });

  document.getElementById("gain-slider").addEventListener("input", function () {
    currentGain = parseFloat(this.value);
    if (gainNode && engineStarted) {
      gainNode.gain.setTargetAtTime(currentGain, audioCtx.currentTime, 0.005);
    }
    updateDisplays();
  });

  document.getElementById("wave-select").addEventListener("change", function () {
    var type = this.value;
    oscillators.forEach(function (vco) {
      vco.osc.type = type;
    });
  });

  function updateDisplays() {
    var cutEl = document.getElementById("cutoff-value");
    if (cutEl) cutEl.textContent = Math.round(currentCutoff) + " Hz";

    var resEl = document.getElementById("resonance-value");
    if (resEl) resEl.textContent = currentResonance.toFixed(1);

    var decEl = document.getElementById("decay-value");
    if (decEl)
      decEl.textContent =
        "Decay: " +
        currentDecay.toFixed(3) +
        " | Self-Osc: " +
        (selfOscActive ? "ON" : "OFF");

    var gainEl = document.getElementById("gain-value");
    if (gainEl) gainEl.textContent = currentGain.toFixed(2);

    // Clip indicator based on amplitude + self-osc state
    var clipEl = document.getElementById("clip-indicator");
    if (clipEl) {
      if (selfOscActive) {
        clipEl.classList.add("active");
      } else {
        clipEl.classList.remove("active");
      }
    }

    // Status bar
    var oscStateEl = document.getElementById("osc-state");
    if (oscStateEl) oscStateEl.textContent = "Self-Osc: " + (selfOscActive ? "ON" : "OFF");

    var chordEl = document.getElementById("chord-display");
    if (chordEl) {
      var waveType = document.getElementById("wave-select").value;
      chordEl.textContent = "Chord: Cmaj (C E G) | " + waveType;
    }
  }

  // ─── Canvas Rendering ──────────────────────────────────────
  var gridCells = [];
  for (var gi = 0; gi < GRID_ROWS; gi++) {
    gridCells[gi] = [];
    for (var gj = 0; gj < GRID_COLS; gj++) {
      gridCells[gi][gj] = {
        baseAlpha: 0.03 + (gi / GRID_ROWS) * 0.05,
        energy: 0,
        distortion: 0,
      };
    }
  }

  function getAmplitudeData() {
    if (!analyser || !engineStarted) return new Uint8Array(0);
    var data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    return data;
  }

  var prevFrame = performance.now();
  var latencySamples = [];

  function renderFrame(timestamp) {
    frameId = requestAnimationFrame(renderFrame);

    // Measure latency
    var now = performance.now();
    var delta = now - prevFrame;
    prevFrame = now;
    latencySamples.push(delta);
    if (latencySamples.length > 60) latencySamples.shift();

    // Update amplitude routing
    var amp = 0;
    if (engineStarted) {
      amp = updateAmplitudeRouting();
    }

    var fftData = getAmplitudeData();

    // Update displays
    var latEl = document.getElementById("latency-display");
    if (latEl && latencySamples.length > 0) {
      var avgLat = latencySamples.reduce(function (a, b) {
        return a + b;
      }, 0) / latencySamples.length;
      var audioLatency = engineStarted ? (1 / (audioCtx.sampleRate / 256) * 1000).toFixed(1) : "--";
      latEl.textContent =
        "Frame: " +
        avgLat.toFixed(1) +
        "ms | Audio: " +
        audioLatency +
        "ms";
    }

    // ── Render Grid ─────────────────────────────────────────
    var cw = canvas.width / dpr;
    var ch = canvas.height / dpr;

    // Clear
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, cw, ch);

    var cellW = cw / GRID_COLS;
    var cellH = ch / GRID_ROWS;
    var padding = 1;

    // Map FFT data to grid cells
    if (fftData.length > 0) {
      for (var row = 0; row < GRID_ROWS; row++) {
        for (var col = 0; col < GRID_COLS; col++) {
          var fftIndex = Math.floor(
            ((row * GRID_COLS + col) / (GRID_ROWS * GRID_COLS)) * fftData.length * 0.5
          );
          var cellAmp = fftData[fftIndex] / 255;

          // Decay affects cell energy
          var energy = cellAmp * (1 + currentDecay * 2);
          gridCells[row][col].energy = gridCells[row][col].energy * 0.92 + energy * 0.08;
          gridCells[row][col].distortion = selfOscActive
            ? gridCells[row][col].distortion * 0.9 + (cellAmp * 0.3) * 0.1
            : gridCells[row][col].distortion * 0.95;
        }
      }
    }

    // Draw grid cells
    for (var row2 = 0; row2 < GRID_ROWS; row2++) {
      for (var col2 = 0; col2 < GRID_COLS; col2++) {
        var cell = gridCells[row2][col2];
        var x = col2 * cellW + padding;
        var y = row2 * cellH + padding;
        var w = cellW - padding * 2;
        var h = cellH - padding * 2;

        // Energy-driven color
        var energyNorm = Math.min(cell.energy, 1);
        var distNorm = Math.min(cell.distortion, 1);

        var r, g, b, alpha;
        if (selfOscActive && distNorm > 0.1) {
          // Red accent for self-osc distortion
          r = Math.round(200 + 55 * distNorm);
          g = Math.round(30 * (1 - distNorm));
          b = Math.round(30 * (1 - distNorm));
          alpha = 0.08 + energyNorm * 0.7;
        } else {
          // Subtle blue-gray for normal state, red tint at high energy
          r = Math.round(80 + energyNorm * 140);
          g = Math.round(80 + energyNorm * 40);
          b = Math.round(110 + energyNorm * 60);
          alpha = 0.05 + energyNorm * 0.5;
        }

        ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + alpha + ")";

        // Distortion offset
        var dx = (Math.sin(timestamp * 0.003 + col2 * 0.5) * distNorm * 4) | 0;
        var dy = (Math.cos(timestamp * 0.004 + row2 * 0.4) * distNorm * 3) | 0;

        ctx.fillRect(x + dx, y + dy, w, h);

        // Grid lines
        ctx.strokeStyle = "rgba(148, 163, 184, " + (0.06 + energyNorm * 0.12) + ")";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, w, h);
      }
    }

    // Draw cutoff position indicator
    if (engineStarted) {
      var cutoffX = (Math.log(currentCutoff / CUTOFF_MIN) /
        Math.log(CUTOFF_MAX / CUTOFF_MIN)) * cw;

      ctx.strokeStyle = selfOscActive ? "rgba(220, 38, 38, 0.8)" : "rgba(220, 38, 38, 0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cutoffX, 0);
      ctx.lineTo(cutoffX, ch);
      ctx.stroke();

      // Glow effect at cutoff position
      var gradient = ctx.createLinearGradient(cutoffX - 20, 0, cutoffX + 20, 0);
      if (selfOscActive) {
        gradient.addColorStop(0, "rgba(220, 38, 38, 0)");
        gradient.addColorStop(0.5, "rgba(220, 38, 38, " + (0.15 + amp * 0.3) + ")");
        gradient.addColorStop(1, "rgba(220, 38, 38, 0)");
      } else {
        gradient.addColorStop(0, "rgba(220, 38, 38, 0)");
        gradient.addColorStop(0.5, "rgba(220, 38, 38, 0.08)");
        gradient.addColorStop(1, "rgba(220, 38, 38, 0)");
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(cutoffX - 20, 0, 40, ch);
    }

    // Dragging highlight
    if (dragging && engineStarted) {
      var dragCutoffX =
        (Math.log(currentCutoff / CUTOFF_MIN) / Math.log(CUTOFF_MAX / CUTOFF_MIN)) * cw;

      ctx.fillStyle = "rgba(220, 38, 38, 0.08)";
      ctx.fillRect(0, 0, dragCutoffX, ch);
    }

    updateDisplays();
  }

  // ─── Render Loop ───────────────────────────────────────────
  function startRenderLoop() {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(renderFrame);
  }

  // Initial render
  function initialRender() {
    var cw = canvas.width / dpr;
    var ch = canvas.height / dpr;
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, cw, ch);

    var cellW = cw / GRID_COLS;
    var cellH = ch / GRID_ROWS;
    var padding = 1;

    for (var i = 0; i < GRID_ROWS; i++) {
      for (var j = 0; j < GRID_COLS; j++) {
        var x = j * cellW + padding;
        var y = i * cellH + padding;
        var w = cellW - padding * 2;
        var h = cellH - padding * 2;

        ctx.fillStyle = "rgba(80, 80, 100, 0.06)";
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = "rgba(148, 163, 184, 0.06)";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, w, h);
      }
    }

    // Draw initial cutoff indicator
    var initXCutoff =
      (Math.log(DEFAULT_CUTOFF / CUTOFF_MIN) / Math.log(CUTOFF_MAX / CUTOFF_MIN)) * cw;
    ctx.strokeStyle = "rgba(220, 38, 38, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(initXCutoff, 0);
    ctx.lineTo(initXCutoff, ch);
    ctx.stroke();
  }
  initialRender();
})();
