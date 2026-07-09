# Blocks Usage — Pocket Signal Machine

| Module | Status | Notes |
|---|---|---|
| `game-loop.js` | Copied | Fixed-timestep update/render loop used as main loop |
| `rng.js` | Copied | Seeded Mulberry32 for reproducible particle spread |
| `input.js` | Copied | Not directly used; manual input handling for knob drag + pad tap |
| `particles.js` | Copied | Not directly used; custom particle pool for pad-hit bursts |
| `tween.js` | Copied | Easing used for pad velocity/glow decay curves |
| `webaudio-kit.js` | Copied | Web Audio API utilities for sound loading |

Key changes: none to load-bearing shapes (fixed timestep, press buffer, trauma curve).
Custom particle pool and input handling written for the instrument-specific interaction pattern
(knob dragging + pad tapping) rather than game-character controls.
