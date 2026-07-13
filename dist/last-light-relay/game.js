/* Last-Light Relay — game logic
 * Fantasy: You are a relay operator. A carrier wave pulses in and out.
 *   Time your transmissions to hit the target window before the signal fades.
 * Primary verb: TIME — press at the right moment to relay the signal.
 */
(function () {
  'use strict';

  var W = 960, H = 640;
  var canvas = document.getElementById('game');
  var cx = W / 2, cy = H / 2;
  var ctx = canvas.getContext('2d');

  /* ── Foundry blocks ─────────────────────────────────────────── */
  var rng = FoundryRng.create('last-light-relay');
  var particles = FoundryParticles.create({ max: 128, rng: rng });
  var shake = FoundryShake.create({ rng: rng, maxOffset: 10 });
  FoundryAudio.install();

  /* ── Game state ─────────────────────────────────────────────── */
  var G = {};

  function reset() {
    G.carrier = 1.0;           // signal strength, drains over time
    G.carrierDrainRate = 0.028; // base drain per second
    G.power = 0;                // relay charge (0-1)
    G.maxPower = 1.0;
    G.powerPerHit = 0.125;     // 8 hits to fill
    G.pulsePhase = 0;
    G.pulseSpeed = 2.8;        // Hz, increases with phase
    G.pulseMinR = 30;
    G.pulseMaxR = 160;
    G.targetInner = 82;
    G.targetOuter = 108;
    G.misses = 0;
    G.maxMisses = 5;
    G.phase = 0;               // 0..4, controls escalation
    G.phaseTime = 0;
    G.phaseInterval = 7;       // seconds per phase
    G.hitFlash = 0;            // feedback timers (seconds)
    G.missFlash = 0;
    G.pulseQuality = 0;        // 0..1, how close last pulse was to target
    G.totalHits = 0;
    G.startTime = FoundryLoop.time();
    G.finished = false;
    G.win = false;
    G.titlePulse = 0;         // for title screen animation
  }

  /* ── Compute current pulse radius ───────────────────────────── */
  function pulseR() {
    var n = (Math.sin(G.pulsePhase * Math.PI * 2) + 1) / 2;
    return G.pulseMinR + n * (G.pulseMaxR - G.pulseMinR);
  }

  /* ── Transmit (the primary verb) ────────────────────────────── */
  function transmit() {
    if (G.finished) return;
    var r = pulseR();
    var targetCenter = (G.targetInner + G.targetOuter) / 2;
    var dist = Math.abs(r - targetCenter);
    var margin = (G.targetOuter - G.targetInner) / 2 + 15 + (4 - G.phase) * 5;

    if (dist <= margin) {
      /* HIT — relay signal */
      var quality = 1 - (dist / margin);
      var bonus = quality > 0.7 ? 0.04 : 0;
      G.power = Math.min(G.power + G.powerPerHit + bonus, G.maxPower);
      G.carrier = Math.min(G.carrier + 0.05, 1.0);
      G.hitFlash = 0.45;
      G.pulseQuality = quality;
      G.totalHits++;
      particles.burst(cx, cy, {
        count: 20, speed: 200, life: 0.7, size: 4,
        color: '#55ffaa', gravity: 0
      });
      if (quality > 0.7) {
        FoundryAudio.pickup();
      } else {
        FoundryAudio.click();
      }
      if (G.power >= G.maxPower) {
        G.finished = true;
        G.win = true;
        FoundryAudio.success();
        particles.burst(cx, cy, {
          count: 40, speed: 280, life: 1.0, size: 5,
          color: '#ffff88', gravity: -40
        });
        setTimeout(function () { FoundryScenes.go('end'); }, 600);
      }
    } else {
      /* MISS — wasted transmission */
      G.misses++;
      G.carrier -= 0.06;
      G.missFlash = 0.4;
      G.pulseQuality = 0;
      shake.add(0.35);
      FoundryAudio.fail();
      if (G.carrier <= 0 || G.misses >= G.maxMisses) {
        G.finished = true;
        G.win = false;
        setTimeout(function () { FoundryScenes.go('end'); }, 400);
      }
    }
  }

  /* ── Escalation ─────────────────────────────────────────────── */
  function tickPhase() {
    G.phase = Math.min(G.phase + 1, 4);
    G.phaseTime = 0;
    switch (G.phase) {
      case 1: G.pulseSpeed = 3.5; G.carrierDrainRate = 0.034; break;
      case 2: G.pulseSpeed = 4.3; G.carrierDrainRate = 0.042; G.pulseMaxR = 175; break;
      case 3: G.pulseSpeed = 5.2; G.carrierDrainRate = 0.055; G.pulseMaxR = 190; break;
      case 4: G.pulseSpeed = 6.0; G.carrierDrainRate = 0.070; G.pulseMaxR = 200; break;
    }
  }

  /* ── Update ─────────────────────────────────────────────────── */
  function updatePlay(dt) {
    if (G.finished) return;

    G.pulsePhase += G.pulseSpeed * dt;

    /* Carrier drains, slightly faster each phase */
    G.carrier = Math.max(G.carrier - G.carrierDrainRate * dt, 0);

    /* Phase escalation */
    G.phaseTime += dt;
    if (G.phaseTime >= G.phaseInterval) tickPhase();

    /* Flash decay */
    G.hitFlash = Math.max(G.hitFlash - dt * 3, 0);
    G.missFlash = Math.max(G.missFlash - dt * 3, 0);

    /* Input */
    if (FoundryInput.consume('transmit') || FoundryInput.pointer.justDown) {
      transmit();
    }

    particles.update(dt);
    shake.update(dt);
    FoundryInput.update(dt);

    /* Auto-fail if carrier fully drained */
    if (G.carrier <= 0 && !G.finished) {
      G.finished = true;
      G.win = false;
      setTimeout(function () { FoundryScenes.go('end'); }, 400);
    }
  }

  /* ── Render play scene ──────────────────────────────────────── */
  function renderPlay(ctx) {
    var r = pulseR();
    var targetCenter = (G.targetInner + G.targetOuter) / 2;
    var inTarget = Math.abs(r - targetCenter) <=
      (G.targetOuter - G.targetInner) / 2 + 15 + (4 - G.phase) * 5;

    /* Background with carrier-tinted darkness */
    var bgDark = Math.floor(10 + (1 - G.carrier) * 8);
    var bgBlue = Math.floor(14 + G.carrier * 10);
    ctx.fillStyle = 'rgb(' + bgDark + ',' + bgBlue + ',' + Math.floor(26 * G.carrier) + ')';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(shake.x, shake.y);

    /* Carrier wave ripples (ambient, shows signal strength) */
    for (var i = 0; i < 3; i++) {
      var rippleR = 260 + i * 25;
      var rippleA = 0.06 * G.carrier * (1 - i * 0.3);
      ctx.strokeStyle = 'rgba(80,160,255,' + rippleA + ')';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, rippleR, 0, Math.PI * 2);
      ctx.stroke();
    }

    /* Target zone — a warm, readable ring */
    var tg = ctx.createRadialGradient(cx, cy, G.targetInner, cx, cy, G.targetOuter);
    if (inTarget) {
      tg.addColorStop(0, 'rgba(255,180,80,0.28)');
      tg.addColorStop(1, 'rgba(255,180,80,0.08)');
    } else {
      tg.addColorStop(0, 'rgba(120,120,140,0.12)');
      tg.addColorStop(1, 'rgba(120,120,140,0.03)');
    }
    ctx.fillStyle = tg;
    ctx.beginPath();

    ctx.arc(cx, cy, G.targetInner, 0, Math.PI * 2);
    ctx.fill('evenodd');


    /* Target ring borders */
    ctx.strokeStyle = inTarget ? 'rgba(255,200,100,0.7)' : 'rgba(120,120,150,0.5)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, G.targetInner, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, G.targetOuter, 0, Math.PI * 2);
    ctx.stroke();

    /* Pulse ring — the thing the player watches */
    var pulseColor = inTarget ? '#77ddff' : '#5588cc';
    var pulseWidth = 3 + G.carrier * 4;
    var glowA = 0.15 + (inTarget ? 0.25 : 0);

    /* Outer glow */
    ctx.strokeStyle = 'rgba(100,200,255,' + glowA + ')';
    ctx.lineWidth = pulseWidth + 12;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    /* Core ring */
    ctx.strokeStyle = pulseColor;
    ctx.lineWidth = pulseWidth;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    /* "RELAY" label in center */
    ctx.fillStyle = 'rgba(180,200,220,0.5)';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RELAY', cx, cy + 5);

    ctx.restore(); /* end shake */

    /* ── HUD (no shake) ───────────────────────────────────── */

    /* Carrier meter — left side */
    var meterX = 30, meterY = 60, meterW = 22, meterH = 420;
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.fillRect(meterX, meterY, meterW, meterH);
    var carrierH = meterH * G.carrier;
    var cHsl = Math.floor(120 * G.carrier);
    ctx.fillStyle = 'hsl(' + cHsl + ',80%,55%)';
    ctx.fillRect(meterX, meterY + meterH - carrierH, meterW, carrierH);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(meterX, meterY, meterW, meterH);
    ctx.fillStyle = 'rgba(180,200,220,0.7)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CARRIER', meterX + meterW / 2, meterY - 8);

    /* Relay power bar — bottom */
    var barY = H - 40, barH = 16, barW = 400;
    var barX = cx - barW / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.fillRect(barX, barY, barW, barH);
    var powerW = barW * (G.power / G.maxPower);
    ctx.fillStyle = '#55ccff';
    ctx.fillRect(barX, barY, powerW, barH);
    ctx.strokeStyle = 'rgba(100,220,255,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
    ctx.fillStyle = 'rgba(180,220,255,0.8)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RELAY POWER', cx, barY - 6);

    /* Hits / Misses — top right */
    ctx.textAlign = 'right';
    ctx.fillStyle = '#55ffaa';
    ctx.font = '13px monospace';
    ctx.fillText('HITS: ' + G.totalHits, W - 25, 35);
    ctx.fillStyle = '#ff6655';
    ctx.fillText('MISSES: ' + G.misses + '/' + G.maxMisses, W - 25, 55);

    /* Phase indicator */
    ctx.fillStyle = 'rgba(255,220,150,0.7)';
    ctx.font = '12px monospace';
    ctx.fillText('PHASE ' + (G.phase + 1) + '/5', W - 25, 78);

    /* Hit/miss flash overlay */
    if (G.hitFlash > 0) {
      ctx.fillStyle = 'rgba(80,255,140,' + (G.hitFlash * 0.12) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (G.missFlash > 0) {
      ctx.fillStyle = 'rgba(255,60,40,' + (G.missFlash * 0.12) + ')';
      ctx.fillRect(0, 0, W, H);
    }

    /* Particles */
    particles.draw(ctx);
  }

  /* ── Title scene ────────────────────────────────────────────── */
  var titleState = { started: false, bob: 0 };

  function renderTitle(ctx, dt) {
    titleState.bob += (dt || 0.016);
    var bob = Math.sin(titleState.bob * 1.5) * 6;

    /* Background */
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, W, H);

    /* Decorative carrier ripples */
    for (var i = 0; i < 4; i++) {
      var phase = titleState.bob * 0.8 + i * 1.5;
      var r = 60 + i * 50 + Math.sin(phase) * 15;
      var a = 0.08 - i * 0.015;
      ctx.strokeStyle = 'rgba(80,160,255,' + a + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy - 40 + bob * 0.3, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    /* Title */
    ctx.fillStyle = '#eedd88';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LAST-LIGHT RELAY', cx, cy - 70 + bob);

    /* Subtitle */
    ctx.fillStyle = 'rgba(160,190,220,0.7)';
    ctx.font = '18px monospace';
    ctx.fillText('Time your transmissions. Catch the signal before it fades.', cx, cy - 20 + bob * 0.5);

    /* Instructions */
    ctx.fillStyle = 'rgba(140,170,200,0.6)';
    ctx.font = '14px monospace';
    ctx.fillText('SPACE / CLICK — transmit when the ring hits the target zone', cx, cy + 40);
    ctx.fillText('8 successful relays to save the signal', cx, cy + 62);

    /* Blinking prompt */
    var blink = (Math.sin(titleState.bob * 3) + 1) / 2;
    ctx.fillStyle = 'rgba(100,255,180,' + (0.4 + blink * 0.6) + ')';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('[ PRESS SPACE OR CLICK TO START ]', cx, cy + 120);
  }

  /* ── End scene ──────────────────────────────────────────────── */
  var endState = { timer: 0 };

  function renderEnd(ctx, dt) {
    endState.timer += dt || 0.016;
    var fadeIn = Math.min(endState.timer * 2, 1);

    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, W, H);

    /* Decorative ripples */
    for (var i = 0; i < 3; i++) {
      var r = 80 + i * 40 + Math.sin(endState.timer * 0.5 + i) * 10;
      var a = 0.06 * fadeIn;
      ctx.strokeStyle = G.win
        ? 'rgba(80,255,140,' + a + ')'
        : 'rgba(255,80,60,' + a + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy - 40, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.globalAlpha = fadeIn;

    if (G.win) {
      ctx.fillStyle = '#55ffaa';
      ctx.font = 'bold 42px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SIGNAL RELAYED', cx, cy - 80);
      ctx.fillStyle = 'rgba(180,220,160,0.7)';
      ctx.font = '18px monospace';
      ctx.fillText('The carrier held. Message delivered.', cx, cy - 40);
    } else {
      ctx.fillStyle = '#ff6655';
      ctx.font = 'bold 42px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SIGNAL LOST', cx, cy - 80);
      ctx.fillStyle = 'rgba(220,160,150,0.7)';
      ctx.font = '18px monospace';
      if (G.carrier <= 0.01) {
        ctx.fillText('The carrier collapsed. No signal reached relay.', cx, cy - 40);
      } else {
        ctx.fillText('Too many missed transmissions. Relay failed.', cx, cy - 40);
      }
    }

    /* Stats */
    ctx.fillStyle = 'rgba(180,200,220,0.7)';
    ctx.font = '15px monospace';
    var elapsed = FoundryLoop.time() - G.startTime;
    ctx.fillText('Hits: ' + G.totalHits + '  |  Misses: ' + G.misses + '  |  Phase: ' + (G.phase + 1) + '/5', cx, cy + 15);
    ctx.fillText('Elapsed: ' + elapsed.toFixed(1) + 's  |  Carrier: ' + Math.floor(G.carrier * 100) + '%', cx, cy + 38);

    /* Classification */
    var classification = '';
    if (G.win) {
      if (G.misses <= 1) classification = 'CLASSIFICATION: FLAWLESS RELAY';
      else if (G.misses <= 3) classification = 'CLASSIFICATION: CLEAN DELIVERY';
      else classification = 'CLASSIFICATION: HARD-WON SIGNAL';
      ctx.fillStyle = '#55ffaa';
    } else {
      classification = 'CLASSIFICATION: SIGNAL LOST';
      ctx.fillStyle = '#ff6655';
    }
    ctx.font = '13px monospace';
    ctx.fillText(classification, cx, cy + 72);

    /* Restart prompt */
    var blink = (Math.sin(endState.timer * 3) + 1) / 2;
    ctx.fillStyle = 'rgba(100,200,255,' + (0.4 + blink * 0.5) + ')';
    ctx.font = '18px monospace';
    ctx.fillText('[ SPACE / CLICK TO RESTART ]', cx, cy + 120);

    ctx.globalAlpha = 1;
  }

  /* ── Scenes ─────────────────────────────────────────────────── */
  FoundryScenes.add('title', {
    enter: function () {
      titleState = { bob: 0 };
    },
    update: function (dt) {
      titleState.bob += dt;
      if (FoundryInput.consume('transmit') || FoundryInput.pointer.justDown) {
        reset();
        FoundryScenes.go('play');
      }
      FoundryInput.update(dt);
    },
    render: function (ctx) {
      renderTitle(ctx, FoundryLoop.STEP);
    }
  });

  FoundryScenes.add('play', {
    enter: function () {
      FoundryAudio.droneStart(50);
    },
    update: function (dt) {
      FoundryTween.update(dt);
      updatePlay(dt);
    },
    render: function (ctx) {
      renderPlay(ctx);
    },
    exit: function () {
      FoundryAudio.droneStop();
    }
  });

  FoundryScenes.add('end', {
    enter: function () {
      endState = { timer: 0 };
    },
    update: function (dt) {
      endState.timer += dt;
      particles.update(dt);
      shake.update(dt);
      if (FoundryInput.consume('transmit') || FoundryInput.pointer.justDown) {
        reset();
        FoundryScenes.go('play');
      }
      FoundryInput.update(dt);
    },
    render: function (ctx) {
      renderEnd(ctx, FoundryLoop.STEP);
      particles.draw(ctx);
    }
  });

  /* ── Boot ───────────────────────────────────────────────────── */
  FoundryInput.install(canvas, {
    actions: { transmit: ['Space'] }
  });

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
