# Worklog — Bunny Orbit

## Session: 2026-07-06 21:24 UTC

### What Changed
- Created `games/bunny-orbit/` — a 3D browser game (Three.js)
- Submitted and collected 2 Asset Foundry jobs:
  - `bunny_companion` → bunny astronaut GLB + textures (2MB)
  - `cozy_audio_pack` → music loop + 8 SFX (~13MB)
- Copied 7 foundry gameplay blocks (game-loop, input, tween, particles, rng, screen-shake, scenes)
- Wrote `blocks_usage.md` documenting module usage and 3D adaptations
- Enhanced game with: thrust particles, screen shake, landing flash, visit ring effects, planet glow pulse, carrot moon shimmer

### Creative Intent
"This should feel like a gentle space adventure where you pilot a cute bunny astronaut through a starlit void, using short thrust burns to hop between colorful planets until reaching a glowing carrot moon."

### Game Design
- **One verb:** Hold to thrust (burn), release to drift
- **Six planets:** Asteros, Bloom, Crater, Dusk, Ember, Frost
- **Goal:** Reach the Carrot Moon at the far end
- **Fuel system:** Drains while thrusting; replenishes on planet landings (+15)
- **Scoring:** Classifications from Bunny Trainee to Legendary Orbit-Hopper

### Technical
- Three.js 0.160 (CDN) for 3D rendering
- GLTFLoader for bunny astronaut GLB (with procedural fallback)
- WebAudio API for music loop + SFX
- Fixed-dt physics (capped at 50fps), camera LERP follow
- Touch support (72px thrust button for mobile)

### Verification
- Chromium headless smoke test: pass (exit 0, no 404s, no JS errors)
- Title screen screenshot: 25KB PNG captured
- All foundry assets loaded from real files
- Preview entrypoint: `.factoryx/preview-entrypoint` → `games/bunny-orbit/index.html`

### Branch
- `factoryx/factory-tb-123/work-order-1783368184543-7-1`
- 37 files, 1656 insertions
- Pushed to origin
