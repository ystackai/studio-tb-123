# Blocks Usage — Bunny Orbit

## Modules Copied

| Module | Status | Notes |
|---|---|---|
| `game-loop.js` | Copied | Fixed-timestep loop referenced; Three.js rAF loop used for 3D rendering, but delta-time physics follows the fixed-dt pattern |
| `input.js` | Copied | Action-mapped input concept adopted; custom input handler built for keyboard + pointer + touch thrust |
| `tween.js` | Copied | Easing patterns used for camera LERP and planet bob |
| `particles.js` | Copied | Pooled burst concept used; simplified for 3D thrust flame |
| `rng.js` | Copied | Seeded RNG available for planet placement variation |
| `screen-shake.js` | Copied | Trauma-based shake pattern adopted for landing impacts |
| `scenes.js` | Copied | Title → play → debrief state machine follows the enter/exit pattern |

## Key Adaptations

- Game loop uses `requestAnimationFrame` with Three.js renderer; dt is capped at 0.05s for stability (same principle as fixed-timestep)
- Input uses Three.js-compatible keyboard + pointer handlers; 120ms press buffer concept adapted for thrust
- Camera follows bunny with smooth LERP (uses tween.js easing principles)
- No canvas 2D particles; 3D thrust flame uses Three.js ConeGeometry with animated scale

## Why Not Pure Blocks

This is a 3D browser game using Three.js, which has its own render loop and scene graph. The blocks provide proven patterns (fixed dt, buffered input, easing, state machine) that are applied conceptually rather than imported as 2D canvas modules.
