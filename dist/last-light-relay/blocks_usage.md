# Blocks Usage — Last-Light Relay

| Module | Reused | Key changes |
|---|---|---|
| `game-loop.js` | Yes (copy) | None — used as-is for fixed-timestep loop |
| `scenes.js` | Yes (copy) | None — three scenes: title, play, end |
| `input.js` | Yes (copy) | One action mapped: `transmit` = Space |
| `tween.js` | Copied, lightly adapted | Loaded in HTML but only `FoundryTween.update()` called each tick; no tweens actually created yet (reserved for later polish) |
| `particles.js` | Yes (copy) | None — burst on hit, big burst on win |
| `screen-shake.js` | Yes (copy) | None — shake on miss only |
| `rng.js` | Yes (copy) | Seeded with `'last-light-relay'` |
| `webaudio-kit.js` | Yes (copy) | `click()`/`pickup()` on hit, `fail()` on miss, `success()` on win, `droneStart/Stop` for atmosphere |

## Rationale

All blocks copied verbatim from `.factoryx/foundry/blocks-2d/` (and `../sound/webaudio-kit.js`). No load-bearing shapes (fixed timestep, press buffer, trauma curve) were changed.
