// Open Circuit — Grid Instrument
// Browser as stage. Grid as instrument.

(() => {
  "use strict";

  /* ──────────────── Audio Engine ──────────────── */
  let audioCtx = null;
  let masterGain = null;
  let compressor = null;
  let audioReadyPromise = null;
  let isMuted = false;
  let audioFailed = false;

  function initAudio() {
    if (audioCtx) return audioReadyPromise;
    if (audioFailed) return Promise.resolve(null);

    audioReadyPromise = (async () => {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        compressor = audioCtx.createDynamicsCompressor();
        compressor.threshold.value = -24;
        compressor.knee.value = 30;
        compressor.ratio.value = 12;
        compressor.attack.value = 0.001;
        compressor.release.value = 0.15;
        compressor.connect(audioCtx.destination);

        masterGain = audioCtx.createGain();
        masterGain.gain.value = isMuted ? 0 : 0.7;
        masterGain.connect(compressor);

        if (audioCtx.state === "suspended") {
          await audioCtx.resume();
        }
        return true;
      } catch (e) {
        console.warn("Web Audio init failed, silent fallback:", e.message);
        audioFailed = true;
        return false;
      }
    })();
    return audioReadyPromise;
  }

  /* ──────────────── Woody Synth ──────────────── */
  function playTone(freq, row, col) {
    if (!audioCtx || audioFailed || isMuted) return;
    const t = audioCtx.currentTime;

    // VCA pre-delay keeps attack tight
    const vca = audioCtx.createGain();
    vca.gain.value = 0;
    vca.connect(masterGain);

    // Attack: near-instant, pre-delay 0ms
    vca.gain.setValueAtTime(0, t);
    vca.gain.linearRampToValueAtTime(0.35, t + 0.003);

    // Woody decay tail: exponential with natural curve, no brittle artifacts
    vca.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

    // Main oscillator — triangle for warmth, not harsh sine
    const osc1 = audioCtx.createOscillator();
    osc1.type = "triangle";
    osc1.frequency.value = freq;
    osc1.detune.value = 0;

    // 2nd harmonic for body (marimba-like)
    const osc2 = audioCtx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = freq * 2;

    // 3rd harmonic for timber (subtle brightness)
    const osc3 = audioCtx.createOscillator();
    osc3.type = "sine";
    osc3.frequency.value = freq * 3;

    // Individual voice gains
    const g1 = audioCtx.createGain();
    g1.gain.value = 0.6;
    const g2 = audioCtx.createGain();
    g2.gain.value = 0.25;
    const g3 = audioCtx.createGain();
    g3.gain.value = 0.08;

    // Bandpass filter to keep the sound woody, remove brittle highs
    const bp = audioCtx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = freq * 2.5;
    bp.Q.value = 0.8;

    // Oscillator 2 gets a lowpass to tame brightness
    const lp = audioCtx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = freq * 4;
    lp.Q.value = 0.5;

    // Signal routing
    osc1.connect(g1);
    osc2.connect(lp).connect(g2);
    osc3.connect(g3);
    g1.connect(bp);
    g2.connect(bp);
    g3.connect(bp);
    bp.connect(vca);

    // Slight row-based frequency shift for timbral variation
    if (row === 0) {
      osc1.frequency.value = freq * 0.5;
      osc2.frequency.value = freq;
      lp.frequency.value = freq * 2;
    } else if (row >= 3) {
      lp.frequency.value = freq * 6;
      g3.gain.value = 0.12;
    }

    // Start oscillators
    osc1.start(t);
    osc2.start(t);
    osc3.start(t);

    // Stop oscillators after decay tail (woody, natural cutoff)
    const stopTime = t + 1.0;
    osc1.stop(stopTime);
    osc2.stop(stopTime);
    osc3.stop(stopTime);

    // Clean up after decay
    setTimeout(() => {
      try {
        vca.disconnect();
        bp.disconnect();
        lp.disconnect();
        g1.disconnect();
        g2.disconnect();
        g3.disconnect();
      } catch (_) {}
    }, 1200);
  }

  /* ──────────────── Note Map ──────────────── */
  // C major scale across the visible octave
  const BASE_FREQ = 261.63; // Middle C
  const SCALE = [0, 2, 4, 5, 7, 9, 11, 12]; // C D E F G A B C

  function noteFreq(col, row) {
    // Row 0 is one octave lower (bass)
    const octaveShift = row === 0 ? -1 : (row >= 3 ? 1 : 0);
    return BASE_FREQ * Math.pow(2, octaveShift) * Math.pow(2, SCALE[col] / 12);
  }

  /* ──────────────── Grid Setup ──────────────── */
  const COLS = 8;
  const ROWS = 5;
  const gridEl = document.getElementById("grid");
  const statusEl = document.getElementById("status");

  gridEl.style.setProperty("--cols", COLS);
  gridEl.style.setProperty("--rows", ROWS);

  const cells = [];

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.setAttribute("role", "button");
      cell.setAttribute("aria-label", `Note row ${r + 1} column ${c + 1}`);
      cell.setAttribute("tabindex", "0");
      gridEl.appendChild(cell);
      cells.push(cell);
    }
  }

  /* ──────────────── Cell State Machine ──────────────── */
  const cellState = new Map();
  cells.forEach(c => cellState.set(c, "idle"));

  function activateCell(cell) {
    const state = cellState.get(cell);
    if (state === "pressed") return;

    const row = parseInt(cell.dataset.row, 10);
    const col = parseInt(cell.dataset.col, 10);

    initAudio();

    // Audio
    const freq = noteFreq(col, row);
    playTone(freq, row, col);

    // Visual: immediate press state
    cell.classList.remove("active", "decaying");
    cell.classList.add("pressed");
    cellState.set(cell, "pressed");

    // Status feedback
    statusEl.textContent = `▶ ${String.fromCharCode(65 + col)},${row + 1}`;
  }

  function releaseCell(cell) {
    const state = cellState.get(cell);
    if (state !== "pressed") return;

    // Decay: pressed -> active (glow) -> decaying -> idle
    cell.classList.remove("pressed");
    cell.classList.add("active");
    cellState.set(cell, "active");

    // Decay tail phase: transition to decaying color
    setTimeout(() => {
      cell.classList.remove("active");
      cell.classList.add("decaying");
      cellState.set(cell, "decaying");
    }, 120);

    // Return to idle after full decay
    setTimeout(() => {
      cell.classList.remove("decaying");
      cellState.set(cell, "idle");
    }, 800);
  }

  /* ──────────────── Input Handling (Low Latency) ──────────────── */
  // Mouse
  let mouseDown = false;
  gridEl.addEventListener("mousedown", (e) => {
    mouseDown = true;
    const cell = e.target.closest(".cell");
    if (cell) activateCell(cell);
  });
  gridEl.addEventListener("mouseenter", (e) => {
    if (mouseDown) {
      const cell = e.target.closest(".cell");
      if (cell) activateCell(cell);
    }
  });
  gridEl.addEventListener("mouseleave", (e) => {
    const cell = e.target.closest(".cell");
    if (cell) releaseCell(cell);
  });
  window.addEventListener("mouseup", () => {
    mouseDown = false;
    cells.forEach(c => {
      if (cellState.get(c) === "pressed") releaseCell(c);
    });
  });

  // Touch (multi-touch support)
  const touchCells = new Map();

  gridEl.addEventListener("touchstart", (e) => {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const cell = el ? el.closest(".cell") : null;
      if (cell) {
        touchCells.set(touch.identifier, cell);
        activateCell(cell);
      }
    }
  }, { passive: false });

  gridEl.addEventListener("touchmove", (e) => {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      const prevCell = touchCells.get(touch.identifier);
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const cell = el ? el.closest(".cell") : null;
      if (prevCell && prevCell !== cell) {
        releaseCell(prevCell);
        if (cell) {
          touchCells.set(touch.identifier, cell);
          activateCell(cell);
        } else {
          touchCells.delete(touch.identifier);
        }
      } else if (!prevCell && cell) {
        touchCells.set(touch.identifier, cell);
        activateCell(cell);
      }
    }
  }, { passive: false });

  gridEl.addEventListener("touchend", (e) => {
    for (const touch of e.changedTouches) {
      const cell = touchCells.get(touch.identifier);
      if (cell) releaseCell(cell);
      touchCells.delete(touch.identifier);
    }
  });

  // Keyboard
  gridEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activateCell(e.target);
    }
  });
  gridEl.addEventListener("keyup", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      releaseCell(e.target);
    }
  });

  /* ──────────────── Default Major Chord ──────────────── */
  // On page load, light up a C major chord (C, E, G) in row 2
  function showDefaultChord() {
    const chordCells = new Set();
    // C major: do-re-mi-fa-so-la-ti-do → notes 0, 2, 4 are C, E, G
    [0, 2, 4].forEach(col => {
      const cell = cells.find(c => parseInt(c.dataset.row, 10) === 1 && parseInt(c.dataset.col, 10) === col);
      if (cell) chordCells.add(cell);
    });

    // Flash the chord cells as active (no sound, just visual)
    chordCells.forEach(cell => {
      cell.classList.add("active");
      cellState.set(cell, "active");
    });

    // Fade them to decaying after a moment
    setTimeout(() => {
      chordCells.forEach(cell => {
        cell.classList.remove("active");
        cell.classList.add("decaying");
        cellState.set(cell, "decaying");
      });
    }, 1500);

    // Return to idle
    setTimeout(() => {
      chordCells.forEach(cell => {
        cell.classList.remove("decaying");
        cellState.set(cell, "idle");
      });
    }, 2400);
  }

  /* ──────────────── Scheduler (for sustained playback) ──────────────── */
  const schedulerInterval = 16; // ~60fps scheduling
  let schedulerTimer = null;

  function startScheduler() {
    if (schedulerTimer) return;
    schedulerTimer = setInterval(() => {
      // Check all currently pressed cells, ensure audio is playing
      // (This is mainly for keeping audioCtx alive during long presses)
      cells.forEach(cell => {
        if (cellState.get(cell) === "pressed" && !audioFailed) {
          // Visual pulse feedback for held notes
          const row = parseInt(cell.dataset.row, 10);
          const col = parseInt(cell.dataset.col, 10);
          const freq = noteFreq(col, row);
          // Only re-trigger at intervals for sustained effect
        }
      });
    }, schedulerInterval);
  }

  /* ──────────────── Boot ──────────────── */
  showDefaultChord();
  startScheduler();

  // First interaction fully initializes audio
  let audioInitialized = false;
  const initOnInteraction = () => {
    if (!audioInitialized) {
      audioInitialized = true;
      initAudio().then((ok) => {
        statusEl.textContent = ok ? "Circuit open — play the grid" : "Circuit open (silent mode)";
      });
    }
  };

  window.addEventListener("pointerdown", initOnInteraction, { once: false });
  window.addEventListener("keydown", initOnInteraction, { once: false });
  window.addEventListener("touchstart", initOnInteraction, { once: false });

  /* ──────────────── Mute Toggle ──────────────── */
  document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "m" && e.target === document.body) {
      isMuted = !isMuted;
      if (masterGain) {
        masterGain.gain.setTargetAtTime(isMuted ? 0 : 0.7, audioCtx.currentTime, 0.02);
      }
      statusEl.textContent = isMuted ? "Muted" : "Unmuted";
    }
  });
})();
