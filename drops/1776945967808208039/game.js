(() => {
  "use strict";

  /* ------------------------------------------------------------------ */
  /*  CONSTANTS                                                          */
  /* ------------------------------------------------------------------ */
  const COLS = 8;
  const ROWS = 4;
  const LPF_BUDGET_MS = 2;
  const TRAIL_DURATION_FRAMES = 18;
  const STEP_MS = 150;

  let bypassActive = false;
  let audioCtx = null;
  const trails = [];
  const gridState = new Uint8Array(COLS * ROWS);

  /* ------------------------------------------------------------------ */
  /*  DOM REFS                                                           */
  /* ------------------------------------------------------------------ */
  const appEl = document.getElementById("app");
  const gridEl = document.getElementById("grid");
  const canvasEl = document.getElementById("trail-canvas");
  const bypassBtn = document.getElementById("bypass-knob");

  const ctx = canvasEl.getContext("2d");

  /* ------------------------------------------------------------------ */
  /*  AUDIO                                                              */
  /* ------------------------------------------------------------------ */
  function ensureAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
  }

  const freqs = [
    [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25],
    [196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00],
    [174.61, 196.00, 220.00, 246.94, 261.63, 293.66, 329.63, 349.23],
    [130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 261.63],
  ];

  function playTone(row, col) {
    ensureAudioCtx();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const lpf = audioCtx.createBiquadFilter();

    lpf.type = "lowpass";
    lpf.frequency.setValueAtTime(2400, now);
    lpf.frequency.exponentialRampToValueAtTime(bypassActive ? 300 : 800, now + 0.15);
    osc.type = "square";
    osc.frequency.setValueAtTime(freqs[row][col], now);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (bypassActive ? 0.08 : 0.3));

    osc.connect(lpf);
    lpf.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + (bypassActive ? 0.12 : 0.5));
  }

  function playPercussiveClick() {
    ensureAudioCtx();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  /* ------------------------------------------------------------------ */
  /*  RENDERER — CANVAS SETUP                                           */
  /* ------------------------------------------------------------------ */
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvasEl.width = window.innerWidth * dpr;
    canvasEl.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener("resize", resizeCanvas, { passive: true });
  resizeCanvas();

  /* ------------------------------------------------------------------ */
  /*  LPF — Low-Pass Filter for Visual Kerning                          */
  /*  Smooths trail positions to prevent jitter on rapid triggers.       */
  /*  Strict ≤2ms budget enforced via performance.mark.                  */
  /* ------------------------------------------------------------------ */
  const lpfSmoothing = 0.35;

  function lpfProcess() {
    const t0 = performance.now();

    for (let i = trails.length - 1; i >= 0; i--) {
      const tr = trails[i];
      tr.xSmoothed += (tr.targetX - tr.xSmoothed) * lpfSmoothing;
      tr.ySmoothed += (tr.targetY - tr.ySmoothed) * lpfSmoothing;

      /* Linear opacity ramp — no easing curves */
      tr.life -= 1;
      if (tr.life <= 0) {
        trails.splice(i, 1);
        continue;
      }
      tr.opacity = (tr.life / TRAIL_DURATION_FRAMES);
    }

    const elapsed = performance.now() - t0;
    if (elapsed > LPF_BUDGET_MS && typeof console !== "undefined") {
      console.warn(`[perf] LPF exceed budget: ${elapsed.toFixed(2)}ms > ${LPF_BUDGET_MS}ms`);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  DECAY TRAIL RENDERER                                               */
  /*  Single accent color, linear opacity fade each frame.                */
  /*  Zero gradients in canvas or CSS.                                    */
  /* ------------------------------------------------------------------ */
  function renderTrails() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = 0; i < trails.length; i++) {
      const tr = trails[i];
      if (tr.opacity <= 0.01) continue;

      ctx.globalAlpha = tr.opacity;
      ctx.fillStyle = "#e63946"; /* accent, solid fill only */
      const size = Math.max(4, 24 * tr.opacity);
      const half = size / 2;
      ctx.fillRect(tr.xSmoothed - half, tr.ySmoothed - half, size, size);
    }

    ctx.globalAlpha = 1;
  }

   function getTrailLife() {
     return bypassActive ? Math.ceil(TRAIL_DURATION_FRAMES / 3) : TRAIL_DURATION_FRAMES;
    }

   function spawnTrail(x, y) {
     trails.push({
       targetX: x,
       targetY: y,
       xSmoothed: x,
       ySmoothed: y,
       life: getTrailLife(),
       opacity: 1,
       });
    }

  /* ------------------------------------------------------------------ */
  /*  GRID BUILD                                                         */
  /* ------------------------------------------------------------------ */
  function buildGrid() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.row = r;
        cell.dataset.col = c;
        gridEl.appendChild(cell);
      }
    }
  }

  buildGrid();

  /* ------------------------------------------------------------------ */
  /*  INPUT                                                              */
  /* ------------------------------------------------------------------ */
  gridEl.addEventListener("click", (e) => {
    const cell = e.target.closest(".cell");
    if (!cell) return;

    ensureAudioCtx();
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const idx = row * COLS + col;

    gridState[idx] ^= 1;
    cell.classList.toggle("active", !!gridState[idx]);

    const rect = cell.getBoundingClientRect();
    spawnTrail(rect.left + rect.width / 2, rect.top + rect.height / 2);

    playTone(row, col);

    // flash class then remove for visual hit feedback
    cell.classList.add("hit");
    requestAnimationFrame(() => cell.classList.remove("hit"));
  });

  /* ------------------------------------------------------------------ */
  /*  BYPASS KNOB                                                        */
  /* ------------------------------------------------------------------ */
  bypassBtn.addEventListener("click", () => {
    bypassActive = !bypassActive;
    bypassBtn.classList.toggle("active", bypassActive);
    playPercussiveClick();

    // On activate: shorten all existing trail lives for stutter effect
    if (bypassActive) {
      for (let i = 0; i < trails.length; i++) {
        trails[i].life = Math.min(trails[i].life, Math.ceil(TRAIL_DURATION_FRAMES / 3));
      }
    }

    // Spawn a bypass trail indicator at button center
    const rect = bypassBtn.getBoundingClientRect();
    spawnTrail(rect.left + rect.width / 2, rect.top + rect.height / 2);
  });

   /* ------------------------------------------------------------------ */
  /*  MAIN LOOP                                                          */
  /* ------------------------------------------------------------------ */
  function frame() {
    lpfProcess();
    renderTrails();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
