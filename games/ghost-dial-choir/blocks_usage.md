# blocks_usage.md — Ghost Dial Choir

## Modules used (all copied from `.factoryx/foundry/blocks-2d/`)

| Module | Status | Notes |
|---|---|---|
| `game-loop.js` | Reused | Fixed-timestep loop drives update/render |
| `input.js` | Reused | Pointer + keyboard; click position determines which dial side to turn |
| `tween.js` | Reused | Loaded for future expansion; not yet called |
| `particles.js` | Reused | Bursts on tune, lock, dead, and chord-payoff events |
| `scenes.js` | Reused | Three scenes: title, play, end |
| `rng.js` | Reused | Seeded with 'ghost-dial-choir' |
| `screen-shake.js` | Reused | Trauma-based shake on stage escalation and voice deaths |
| `webaudio-kit.js` | Reused | Tone one-shots for tuning clicks, lock tones, chord, and crash |

## Key adaptations

- None to load-bearing shapes (fixed timestep, press buffer, trauma curve preserved)
- `webaudio-kit.js` called via `_tone()` for each voice's note and SFX
- Particle bursts use palette colors from game config
