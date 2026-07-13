/* FoundryShake — trauma-based screen shake.
 *
 * Why trauma-based: naive shake (random offset while a timer runs) looks
 * mechanical and stacks badly. Trauma accumulates on impact, decays
 * smoothly, and shake amplitude follows trauma² — small hits whisper, big
 * hits land, overlapping hits feel bigger without doubling duration.
 *
 * Usage:
 *   var shake = FoundryShake.create({ rng: rng, maxOffset: 8 });
 *   shake.add(0.3);            // small hit    (trauma is clamped to 1)
 *   shake.add(0.7);            // big hit
 *   ... in update(dt):  shake.update(dt);
 *   ... in render():    ctx.save();
 *                       ctx.translate(shake.x, shake.y);
 *                       ...draw world...
 *                       ctx.restore();     // HUD draws unshaken, after restore
 *
 * Discipline: reserve above 0.5 for events the player caused. Ambient
 * shake is noise, not juice.
 */
(function () {
  'use strict';

  window.FoundryShake = {
    create: function (opts) {
      opts = opts || {};
      var maxOffset = opts.maxOffset || 8;
      var decay = opts.decay || 1.6; // trauma per second
      var rng = opts.rng || { range: function (a, b) { return a + Math.random() * (b - a); } };

      return {
        trauma: 0,
        x: 0,
        y: 0,

        add: function (amount) {
          this.trauma = Math.min(this.trauma + amount, 1);
        },

        update: function (dt) {
          this.trauma = Math.max(this.trauma - decay * dt, 0);
          var amplitude = this.trauma * this.trauma * maxOffset;
          this.x = rng.range(-amplitude, amplitude);
          this.y = rng.range(-amplitude, amplitude);
        },
      };
    },
  };
})();
