# Rotor Chrome Authored Hero Integration

## Intervention

- Creative intervention: `tb-123-rotor-chrome-night-canyon--assets-pass-03-using-the-registered-qwen3-6-27b-coding-m`
- Input snapshot: `tb-123-rotor-chrome-night-canyon:production:c4822b3:qwen-worker-ready-v4`
- Work Order: `work-order-1783652362207-7-3`
- Recovery note: run 1 produced a useful uncommitted integration but stalled during browser capture. This branch reconstructs and verifies that bounded integration instead of treating the failed run as creative success.

## Authored Asset

- Runtime asset: `games/rotor-chrome-night-canyon/assets/generated/rotorcraft-hero-seed/rotorcraft_hero.glb`
- Immutable source: `games/rotor-chrome-night-canyon/assets/source/build_rotorcraft_hero.py`
- Source and rendered evidence were introduced by merged Studio PR #139.
- Required scene nodes: `RotorChromeHero`, `MainRotor`, and `TailRotor`.

## Integration

- `games/rotor-chrome-night-canyon/main.js` loads the GLB into the active chase view.
- The procedural rotorcraft remains visible from frame one and remains the load or node-validation fallback.
- A successful load preserves flight state, replaces only the visible craft, and drives the authored rotors around their exported local Y axes.
- The chase camera and asset scale keep the craft identifiable while leaving the nearest radar gate and canyon readable.
- The canvas records `data-rotorcraft-asset` and `data-rotorcraft-nodes` as deterministic runtime evidence.

## Preserved Media

- Music: `assets/generated/foundry_music_loop.wav` (7,362,824 bytes)
- SFX: `sfx_movement.wav`, `sfx_interaction.wav`, `sfx_reveal.wav`, `sfx_danger.wav`, `sfx_impact.wav`, and `reveal_sting.wav`
- Existing radar gates, signal pylons, stem pickups, final hangar, debrief, and relaunch remain in the play loop.

## Visual Evidence

- `screenshots/active-play-authored-rotorcraft.png`
- `screenshots/final-payoff.png`

The authored craft is now the central playable object rather than an unused asset. This is an authored-identity improvement, not a claim that visual composition or the final chord bloom is finished; both remain candidates for later adaptive passes.
