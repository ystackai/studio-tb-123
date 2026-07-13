/* Ghost Dial Choir — a signal-machine toy.
 * Fantasy: Tune five unstable ghost voices into a fragile chord.
 * Verb: tune. Click left/right of a dial to rotate it toward its target.
 * Escalation: drift increases over time; locked dials can unlock under pressure.
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Config                                                            */
  /* ------------------------------------------------------------------ */
  var W = 800, H = 600;
  var NUM_VOICES = 5;
  var TUNING_TOLERANCE = 0.22;        // radians; needle within this = "tuned"
  var COLLAPSE_THRESHOLD = 1.4;        // radians; beyond this = voice dies
  var INITIAL_DRIFT = 0.6;             // max drift speed (rad/s)
  var DRIFT_ESCALATION = 0.35;        // added per stage
  var ESCALATION_INTERVAL = 10;        // seconds between drift increases
  var TUNE_STEP = 0.18;               // radians per click

  /* Palette */
  var C_BG = '#0a0a14';
  var C_RING_UNTUNED = '#5a3040';
  var C_RING_NEAR = '#8a6030';
  var C_RING_TUNED = '#30aa60';
  var C_RING_DEAD = '#301520';
  var C_NEEDLE = '#d0c8b0';
  var C_TARGET = '#40b8a0';
  var C_TEXT = '#b0a890';
  var C_TEXT_DIM = '#504838';
  var C_PAYOFF = '#50e0c0';

  /* ------------------------------------------------------------------ */
  /*  Setup                                                             */
  /* ------------------------------------------------------------------ */
  var canvas = document.getElementById('c');
  var ctx = canvas.getContext('2d');
  canvas.width = W;
  canvas.height = H;

  // Fit canvas to window
  function resize() {
    var scale = Math.min(window.innerWidth / W, window.innerHeight / H);
    canvas.style.width = (W * scale) + 'px';
    canvas.style.height = (H * scale) + 'px';
  }
  window.addEventListener('resize', resize);
  resize();

  var rng = FoundryRng.create('ghost-dial-choir');
  var shake = FoundryShake.create({ rng: rng, maxOffset: 6 });
  var particles = FoundryParticles.create({ max: 200, rng: rng });
  FoundryAudio.install();

  /* Input */
  var dialHit = null; // which dial was clicked, and left or right side
  FoundryInput.install(canvas, {
    actions: {
      confirm: ['Space', 'Enter']
    }
  });

  /* ------------------------------------------------------------------ */
  /*  Voice (dial) model                                                */
  /* ------------------------------------------------------------------ */
  var voices = [];
  var CX = W / 2, CY = H / 2 + 30;

  // Arc positions for 5 voices (semi-circle, top-center)
  var arcAngles = [
    Math.PI * 0.85,  // left
    Math.PI * 0.68,
    Math.PI * 0.50,   // center
    Math.PI * 0.32,
    Math.PI * 0.15    // right
  ];
  var ARC_R = 230;
  var DIAL_R = 48;

  function voicePositions() {
    var pos = [];
    for (var i = 0; i < arcAngles.length; i++) {
      pos.push({
        x: CX + Math.cos(arcAngles[i] - Math.PI / 2) * ARC_R,
        y: CY - Math.sin(arcAngles[i] - Math.PI / 2) * ARC_R * 0.55
      });
    }
    return pos;
  }

  var posCache = voicePositions();

  function resetVoices() {
    voices = [];
    posCache = voicePositions();
    for (var i = 0; i < NUM_VOICES; i++) {
      voices.push({
        angle: rng.range(0.5, 2.0),     // starting angle offset (random)
        target: 0,                          // target is 0 offset
        tuned: false,
        dead: false,
        lockTimer: 0,                     // time spent in tuned state
        driftSpeed: 0,                    // current drift rate
        driftDir: rng.next() < 0.5 ? 1 : -1,
        driftPhase: rng.range(0, Math.PI * 2),
        // visual state
        ringPulse: 0,
        name: ['Alpha', 'Beta', 'Gamma', 'Delta', 'Echo'][i]
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Game state                                                         */
  /* ------------------------------------------------------------------ */
  var state = {
    time: 0,
    stage: 0,
    tunedCount: 0,
    deadCount: 0,
    harmony: 0,        // 0-1
    running: false,
    result: '',        // 'success' or 'failure'
    resultTimer: 0,
    resultMsg: '',
    resultScore: 0
  };

  function resetState() {
    state.time = 0;
    state.stage = 0;
    state.tunedCount = 0;
    state.deadCount = 0;
    state.harmony = 0;
    state.running = true;
    state.result = '';
    state.resultTimer = 0;
    state.resultMsg = '';
    state.resultScore = 0;
    resetVoices();
    FoundryTween.cancelAll && FoundryTween.cancelAll();
  }

  /* ------------------------------------------------------------------ */
  /*  Audio helpers — dial tuning sounds                                */
  /* ------------------------------------------------------------------ */
  var freqTable = [220, 261.6, 293.7, 329.6, 392.0]; // A3, C4, D4, E4, G4

  function playTone(idx, duration, vol) {
    if (!FoundryAudio.ready()) return;
    FoundryAudio._tone({
      freq: freqTable[idx],
      dur: duration || 0.3,
      peak: vol || 0.15,
      type: 'sine'
    });
  }

  function playChord() {
    for (var i = 0; i < NUM_VOICES; i++) {
      playTone(i, 2.5, 0.12);
    }
  }

  function playCrash() {
    if (!FoundryAudio.ready()) return;
    FoundryAudio._tone({
      freq: 80,
      sweepTo: 30,
      dur: 0.8,
      peak: 0.25,
      type: 'sawtooth'
    });
  }

  function playTuneClick() {
    if (!FoundryAudio.ready()) return;
    FoundryAudio._tone({
      freq: 600,
      dur: 0.06,
      peak: 0.08,
      type: 'square'
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Pointer-to-dial mapping                                           */
  /* ------------------------------------------------------------------ */
  function hitTestDial(px, py) {
    for (var i = 0; i < voices.length; i++) {
      if (voices[i].dead) continue;
      var p = posCache[i];
      var dx = px - p.x, dy = py - p.y;
      if (dx * dx + dy * dy <= DIAL_R * DIAL_R) {
        return { idx: i, side: dx < 0 ? -1 : 1 };
      }
    }
    return null;
  }

  /* ------------------------------------------------------------------ */
  /*  Scenes                                                            */
  /* ------------------------------------------------------------------ */

  // --- TITLE scene ---
  FoundryScenes.add('title', {
    enter: function () {
      resetState();
      state.running = false;
    },
    update: function (dt) {
      // Animate the dials gently in the background
      for (var i = 0; i < voices.length; i++) {
        voices[i].angle += Math.sin(state.time * 0.5 + i * 1.3) * 0.08 * dt;
      }
      state.time += dt;

      if (FoundryInput.consume('confirm') || FoundryInput.pointer.justDown) {
        FoundryAudio._ensure();
        FoundryScenes.go('play');
      }
    },
    render: function (ctx, alpha) {
      drawBackground(ctx);
      drawDials(ctx);
      drawTitle(ctx);
    }
  });

  // --- PLAY scene ---
  FoundryScenes.add('play', {
    enter: function () {
      resetState();
      state.running = true;
    },
    update: function (dt) {
      state.time += dt;

      // Escalation
      var newStage = Math.floor(state.time / ESCALATION_INTERVAL);
      if (newStage > state.stage) {
        state.stage = newStage;
        // Screen flash on stage change
        shake.add(0.3);
      }

      var driftRate = INITIAL_DRIFT + state.stage * DRIFT_ESCALATION;

      for (var i = 0; i < voices.length; i++) {
        var v = voices[i];
        if (v.dead) continue;

        // Sinusoidal drift + random jitter
        v.driftPhase += dt * (1 + state.stage * 0.3);
        var drift = Math.sin(v.driftPhase * 1.7 + i * 2.1) * driftRate * v.driftDir;
        // Random perturbations
        if (rng.chance(0.02 + state.stage * 0.01)) {
          drift += rng.range(-driftRate * 0.5, driftRate * 0.5);
        }
        v.angle += drift * dt;

        // Check tuned state
        var dist = Math.abs(v.angle);
        if (dist <= TUNING_TOLERANCE) {
          v.lockTimer += dt;
          if (!v.tuned && v.lockTimer >= 0.4) {
            v.tuned = true;
            state.tunedCount++;
            playTone(i, 0.6, 0.15);
            particles.burst(posCache[i].x, posCache[i].y, {
              count: 8, color: C_RING_TUNED, speed: 80, life: 0.6, size: 3, gravity: -40
            });
          }
        } else {
          v.lockTimer = Math.max(0, v.lockTimer - dt * 2);
          if (v.tuned && dist > TUNING_TOLERANCE * 1.5) {
            // Pressure can unlock a dial
            if (state.stage >= 1) {
              v.tuned = false;
              state.tunedCount--;
            }
          }
        }

        // Check collapse
        if (dist > COLLAPSE_THRESHOLD) {
          v.dead = true;
          v.tuned = false;
          state.deadCount++;
          shake.add(0.6);
          playCrash();
          particles.burst(posCache[i].x, posCache[i].y, {
            count: 15, color: '#803040', speed: 150, life: 1.0, size: 4, gravity: 60
          });
        }
      }

      // Harmony
      state.harmony = state.tunedCount / NUM_VOICES;

      // Win check
      if (state.tunedCount >= NUM_VOICES) {
        state.result = 'success';
        state.resultTimer = 0;
        state.resultScore = Math.max(1, Math.round(100 - state.time * 0.5 + state.stage * 10));
        state.resultMsg = 'CHOIR LOCKED';
        playChord();
        for (var j = 0; j < voices.length; j++) {
          particles.burst(posCache[j].x, posCache[j].y, {
            count: 20, color: C_PAYOFF, speed: 120, life: 1.5, size: 4, gravity: -30
          });
        }
        shake.add(0.4);
        FoundryScenes.go('end');
      }

      // Fail check
      if (state.deadCount >= 3) {
        state.result = 'failure';
        state.resultTimer = 0;
        state.resultScore = Math.max(0, state.tunedCount * 20);
        state.resultMsg = 'SIGNAL LOST';
        FoundryScenes.go('end');
      }

      // Process pointer input
      if (FoundryInput.pointer.justDown && state.running) {
        var hit = hitTestDial(FoundryInput.pointer.x, FoundryInput.pointer.y);
        if (hit) {
          var voice = voices[hit.idx];
          if (!voice.dead) {
            voice.angle += -hit.side * TUNE_STEP;
            playTuneClick();
            particles.burst(posCache[hit.idx].x, posCache[hit.idx].y, {
              count: 4, color: C_NEEDLE, speed: 50, life: 0.3, size: 2
            });
          }
        }
      }

      // Keyboard: numpad 1-5 tune specific dials
      // (handled via pointer since we use click positions)

      FoundryInput.update(dt);
      particles.update(dt);
      shake.update(dt);
      FoundryTween.update(dt);
    },
    render: function (ctx, alpha) {
      drawBackground(ctx);
      ctx.save();
      ctx.translate(shake.x, shake.y);
      drawDials(ctx);
      drawHarmonyBar(ctx);
      drawStageIndicator(ctx);
      particles.draw(ctx);
      ctx.restore();
    }
  });

  // --- END scene ---
  FoundryScenes.add('end', {
    enter: function () {
      state.resultTimer = 0;
    },
    update: function (dt) {
      state.resultTimer += dt;
      state.time += dt;
      particles.update(dt);
      shake.update(dt);
      FoundryTween.update(dt);

      if (FoundryInput.consume('confirm') ||
          (FoundryInput.pointer.justDown && state.resultTimer > 1.5)) {
        FoundryAudio._ensure();
        FoundryScenes.go('title');
      }
    },
    render: function (ctx, alpha) {
      drawBackground(ctx);
      ctx.save();
      ctx.translate(shake.x, shake.y);
      drawDials(ctx);
      drawHarmonyBar(ctx);
      particles.draw(ctx);
      ctx.restore();
      drawEndScreen(ctx);
    }
  });

  /* ------------------------------------------------------------------ */
  /*  Render helpers                                                    */
  /* ------------------------------------------------------------------ */

  function drawBackground(ctx) {
    ctx.fillStyle = C_BG;
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = '#12121e';
    ctx.lineWidth = 0.5;
    for (var x = 0; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (var y = 0; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  function dialColor(v) {
    if (v.dead) return C_RING_DEAD;
    if (v.tuned) return C_RING_TUNED;
    var dist = Math.abs(v.angle);
    if (dist < TUNING_TOLERANCE * 0.6) return C_RING_TUNED;
    if (dist < TUNING_TOLERANCE * 1.2) return C_RING_NEAR;
    return C_RING_UNTUNED;
  }

  function drawDials(ctx) {
    for (var i = 0; i < voices.length; i++) {
      var v = voices[i];
      var p = posCache[i];
      drawSingleDial(ctx, p.x, p.y, v, i);
    }
  }

  function drawSingleDial(ctx, cx, cy, v, idx) {
    var col = dialColor(v);
    var op = v.dead ? 0.3 : 1;

    // Outer ring
    ctx.globalAlpha = op;
    ctx.beginPath();
    ctx.arc(cx, cy, DIAL_R, 0, Math.PI * 2);
    ctx.fillStyle = '#141420';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = col;
    ctx.stroke();

    // Target zone (small arc at angle=0, i.e. top of dial)
    ctx.beginPath();
    ctx.arc(cx, cy, DIAL_R - 4, -TUNING_TOLERANCE - 0.1, TUNING_TOLERANCE + 0.1, false);
    ctx.lineWidth = 5;
    ctx.strokeStyle = v.tuned ? C_PAYOFF : C_TARGET;
    ctx.globalAlpha = v.tuned ? 0.9 : 0.4;
    ctx.stroke();

    // Tick marks around the dial
    ctx.globalAlpha = op * 0.3;
    for (var t = 0; t < 24; t++) {
      var a = (t / 24) * Math.PI * 2 - Math.PI / 2;
      var inner = DIAL_R - 12;
      var outer = DIAL_R - 6;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
      ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
      ctx.strokeStyle = '#404050';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Needle
    ctx.globalAlpha = op;
    var needleAngle = -Math.PI / 2 + v.angle;
    var nx = cx + Math.cos(needleAngle) * (DIAL_R - 16);
    var ny = cy + Math.sin(needleAngle) * (DIAL_R - 16);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(nx, ny);
    ctx.strokeStyle = C_NEEDLE;
    ctx.lineWidth = v.dead ? 1.5 : 3;
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();

    // Voice label
    ctx.globalAlpha = op * 0.7;
    ctx.fillStyle = C_TEXT;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(v.name, cx, cy + DIAL_R + 16);

    // Tuned indicator
    if (v.tuned) {
      ctx.globalAlpha = 0.8 + Math.sin(state.time * 4) * 0.2;
      ctx.fillStyle = C_PAYOFF;
      ctx.font = 'bold 10px monospace';
      ctx.fillText('LOCKED', cx, cy - DIAL_R - 8);
    }

    // Dead indicator
    if (v.dead) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#803040';
      ctx.font = '10px monospace';
      ctx.fillText('DEAD', cx, cy - DIAL_R - 8);
    }

    ctx.globalAlpha = 1;
  }

  function drawHarmonyBar(ctx) {
    var bw = 400, bh = 12;
    var bx = (W - bw) / 2, by = H - 60;

    ctx.fillStyle = '#181828';
    ctx.fillRect(bx, by, bw, bh);

    var fill = bw * state.harmony;
    var barCol = state.harmony >= 1 ? C_PAYOFF : (state.harmony > 0.5 ? '#40a080' : '#605030');
    ctx.fillStyle = barCol;
    ctx.fillRect(bx, by, fill, bh);

    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);

    // Label
    ctx.fillStyle = C_TEXT;
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('HARMONY  ' + Math.round(state.harmony * 100) + '%', W / 2, by - 6);

    // Dead voices counter
    if (state.deadCount > 0) {
      ctx.fillStyle = '#804040';
      ctx.textAlign = 'right';
      ctx.fillText(state.deadCount + '/3 lost', bx + bw, by + bh + 16);
    }
  }

  function drawStageIndicator(ctx) {
    ctx.fillStyle = C_TEXT_DIM;
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('DRIFT: ' + (INITIAL_DRIFT + state.stage * DRIFT_ESCALATION).toFixed(1), 20, 24);
  }

  function drawTitle(ctx) {
    // Title overlay
    ctx.fillStyle = 'rgba(10,10,20,0.6)';
    ctx.fillRect(0, H / 2 - 80, W, 160);

    ctx.fillStyle = C_PAYOFF;
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GHOST DIAL CHOIR', W / 2, H / 2 - 20);

    ctx.fillStyle = C_TEXT;
    ctx.font = '14px monospace';
    ctx.fillText('Tune five ghost voices into a fragile chord', W / 2, H / 2 + 14);

    ctx.fillStyle = C_TEXT_DIM;
    ctx.font = '12px monospace';
    ctx.fillText('Click left/right side of a dial to turn it', W / 2, H / 2 + 40);
    ctx.fillText('Space or tap to start', W / 2, H / 2 + 60);
  }

  function drawEndScreen(ctx) {
    var success = state.result === 'success';
    var overlay = 'rgba(10,10,20,0.75)';
    ctx.fillStyle = overlay;
    ctx.fillRect(0, H / 2 - 80, W, 160);

    ctx.fillStyle = success ? C_PAYOFF : '#804040';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(state.resultMsg, W / 2, H / 2 - 20);

    ctx.fillStyle = C_TEXT;
    ctx.font = '14px monospace';
    ctx.fillText('Score: ' + state.resultScore + '  |  Voices: ' + state.tunedCount + '/' + NUM_VOICES, W / 2, H / 2 + 10);

    var t = success ? 'All voices locked in harmony.' : state.deadCount + ' voices collapsed.';
    ctx.fillText(t, W / 2, H / 2 + 34);

    if (state.resultTimer > 1.5) {
      ctx.fillStyle = C_TEXT_DIM;
      ctx.font = '12px monospace';
      ctx.fillText('Space or tap to try again', W / 2, H / 2 + 60);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Start                                                             */
  /* ------------------------------------------------------------------ */
  FoundryScenes.go('title');

  FoundryLoop.start({
    update: function (dt) {
      FoundryScenes.update(dt);
    },
    render: function (alpha) {
      FoundryScenes.render(ctx, alpha);
    }
  });

})();
