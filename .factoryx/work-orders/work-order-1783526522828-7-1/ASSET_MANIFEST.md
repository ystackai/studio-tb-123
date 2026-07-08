# Asset Manifest — Bunny Orbit (Retry)

**Retry of:** `work-order-1783444411754-7-6` (failed: zellij session infra error, not code issue)
**Work Order:** `work-order-1783526522828-7-1`
**Creative Intent:** "This should feel like piloting a small bunny astronaut through a whimsical miniature solar system, where gentle thrust burns and patient drifting let you slingshot between tiny planets on your way to a glowing carrot moon."

## Foundry Jobs

### 1. bunny_companion (3D Bunny Astronaut)
- **Recipe**: `bunny_companion`
- **Job ID**: `asset-1783526733335-14d1c176`
- **Asset Name**: `bunny_astronaut`
- **Request**: `{"recipe":"bunny_companion","asset_name":"bunny_astronaut","prompt":"A cute bunny wearing a translucent space helmet and a puffy astronaut suit, game-ready 3D character, soft rounded proportions, pastel colors, suitable for a cozy space exploration game","style":"cozy cartoon"}`
- **State**: completed
- **Copied outputs**:
   - `outputs/asset-1783526733335-14d1c176/bunny_companion.glb` → `games/bunny-orbit/assets/generated/bunny_companion.glb` (2.0 MB)
   - `outputs/.../bunny_companion_contact_sheet.png` → `games/bunny-orbit/assets/generated/bunny_companion_contact_sheet.png` (437 KB)
   - `outputs/.../bunny_companion_poster.png` → `games/bunny-orbit/assets/generated/bunny_companion_poster.png` (345 KB)
   - `outputs/.../bunny_companion_turntable.gif` → `games/bunny-orbit/assets/generated/bunny_companion_turntable.gif` (2.5 MB)
   - `outputs/.../textures/bunny_fur_*.png` → `games/bunny-orbit/assets/generated/textures/` (4 texture files)

### 2. cozy_audio_pack (Music + SFX)
- **Recipe**: `cozy_audio_pack`
- **Job ID**: `asset-1783526740043-d0a3362f`
- **Asset Name**: `bunny_orbit_audio`
- **Request**: `{"recipe":"cozy_audio_pack","asset_name":"bunny_orbit_audio","prompt":"Gentle wonder space music with soft ambient loop, thrust rumble SFX, cushioned landing SFX, and a bright payoff chime - cozy game audio for a bunny astronaut orbit-hopping game","style":"gentle wonder"}`
- **State**: completed
- **Music**:
   - `outputs/.../music_v2/foundry_music_loop.wav` → `games/bunny-orbit/assets/generated/foundry_music_loop.wav` (5.3 MB, 30.97s loop)
- **SFX** (4 required, 8 delivered):
   - `sfx_interaction.wav` → landing/cushion SFX (59 KB, 0.34s)
   - `sfx_movement.wav` → thrust rumble SFX (59 KB, 0.34s)
   - `sfx_danger.wav` → danger/out-of-fuel SFX (73 KB, 0.42s)
   - `sfx_impact.wav` → impact SFX (73 KB, 0.42s)
   - `sfx_reveal.wav` → payoff/reach moon SFX (125 KB, 0.72s)
   - Additional: `sfx_payoff.wav`, `bunny_hop_plush.wav`, `pickup_chime_bright.wav`, `soft_impact_puff.wav`, `ui_confirm_glass.wav`

## Integration Points

- **bunny_companion.glb**: Loaded via Three.js GLTFLoader as the visible protagonist (hero character). Falls back to procedural bunny primitive if GLB fails to load.
- **Music**: `foundry_music_loop.wav` plays as looping ambience after player clicks "Launch" (user gesture)
- **SFX mapping**:
   - Thrust burn → `sfx_movement.wav` (plays during thrust, with cooldown)
   - Landing on planet → `sfx_interaction.wav` (cushioned landing feel)
   - Reaching carrot moon (payoff) → `sfx_reveal.wav` (reveal/chime)
   - Out of fuel / danger → `sfx_danger.wav`

## Total Payload
- Visual assets: ~5.2 MB (GLB + contact sheet + poster + turntable + textures)
- Audio assets: ~5.7 MB (music + 6 SFX files)
- Game code: 24 KB (single index.html)
- Foundry blocks (lib): ~18 KB
- **Grand total: ~13 MB** (all self-contained, no external deps except Three.js from CDN)

## Foundry Blocks Used
- `game-loop.js` — Fixed-timestep update/render loop (copied as-is)
- `input.js` — Keyboard + pointer with press buffering (copied as-is)
- `scenes.js` — Title → play → end state machine (copied as-is)
- `particles.js` — Pooled canvas bursts for thrust/landing effects (copied as-is)
- `tween.js` — Easing engine (copied as-is)
- `rng.js` — Seeded mulberry32 (copied as-is)
