# Asset Manifest — Bunny Orbit (Retry)

**Work Order**: `work-order-1783526522828-7-1`
**Prior WO**: `work-order-1783444411754-7-6` (failed: zellij session error; also had importmap JS syntax failure)
**Recovery**: Replaced `type="importmap"` + ES module imports with global CDN script tag; verified no JS syntax errors.

## Recovery Notes

The prior work order produced all assets and a working game. Two issues caused failure:
1. **Infra**: zellij session resource exhaustion (os error 11) — not a code fix, just retry
2. **JS syntax**: The `<script type="importmap">` block contained JSON (`"imports": {`) which the browser runtime verifier parsed as JavaScript, producing `SyntaxError: Unexpected token ':'`. Fixed by removing the importmap entirely and loading Three.js as a global script from CDN.

## Foundry Jobs

### 1. bunny_companion (3D Bunny Astronaut)
- **Recipe**: `bunny_companion`
- **Job ID**: `asset-1783452135503-5eb1e408`
- **Request**: `{"recipe":"bunny_companion","asset_name":"bunny_astronaut","prompt":"A cute bunny wearing a translucent space helmet and a puffy astronaut suit, game-ready 3D character, soft rounded proportions, pastel colors, suitable for a cozy space exploration game","style":"cozy cartoon"}`
- **Copied outputs**:
   - `bunny_companion.glb` → `games/bunny-orbit/assets/generated/bunny_companion.glb` (2.0 MB)
   - `bunny_companion_contact_sheet.png` → `games/bunny-orbit/assets/generated/bunny_companion_contact_sheet.png` (437 KB)
   - `bunny_companion_poster.png` → `games/bunny-orbit/assets/generated/bunny_companion_poster.png` (345 KB)
   - `bunny_companion_turntable.gif` → `games/bunny-orbit/assets/generated/bunny_companion_turntable.gif` (2.5 MB)
   - Textures: `bunny_fur_albedo.png`, `bunny_fur_height.png`, `bunny_fur_normal.png`, `bunny_fur_roughness.png` → `games/bunny-orbit/assets/generated/textures/` (1.7 MB total)

### 2. cozy_audio_pack (Music + SFX)
- **Recipe**: `cozy_audio_pack`
- **Job ID**: `asset-1783452143242-e0e4511f`
- **Request**: `{"recipe":"cozy_audio_pack","asset_name":"bunny_orbit_audio","prompt":"Gentle wonder space music with soft ambient loop, thrust rumble SFX, cushioned landing SFX, and a bright payoff chime - cozy game audio for a bunny astronaut orbit-hopping game","style":"gentle wonder"}`
- **Music**:
   - `foundry_music_loop.wav` → `games/bunny-orbit/assets/generated/foundry_music_loop.wav` (5.3 MB, 30.97s)
- **SFX** (4 required, 8 delivered):
   - `sfx_interaction.wav` → landing SFX (59 KB, 0.34s)
   - `sfx_movement.wav` → thrust rumble (59 KB, 0.34s)
   - `sfx_danger.wav` → danger/death (73 KB, 0.42s)
   - `sfx_impact.wav` → impact (73 KB, 0.42s)
   - `sfx_reveal.wav` → reveal/payoff (125 KB, 0.72s)
   - `sfx_payoff.wav` → payoff chime (83 KB, 0.48s)
   - `bunny_hop_plush.wav` → extra hop SFX (59 KB, 0.34s)
   - `pickup_chime_bright.wav` → extra chime (125 KB, 0.72s)

## Integration Points

- **bunny_companion.glb**: Referenced in `index.html`; Foundry-inspired fallback geometry provides the visible protagonist in-game (bunny astronaut with helmet, ears, backpack, thruster)
- **Music**: `foundry_music_loop.wav` plays as looping ambience after user taps "Launch"
- **SFX mapping**:
   - Thrust burn → `sfx_movement.wav`
   - Landing on planet → `sfx_interaction.wav`
   - Reaching carrot moon (payoff) → `sfx_reveal.wav`
   - Game over / out of fuel → `sfx_danger.wav`
- **Textures**: Bunny fur texture maps (albedo, height, normal, roughness) available in `assets/generated/textures/`

## Total Payload
- Visual assets: ~7.9 MB (GLB + images + textures)
- Audio assets: ~6.1 MB (music + 8 SFX)
- Three.js: loaded from CDN (590 KB when cached)
- Game HTML/JS: 22 KB
- **Grand total: ~16 MB** (assets self-contained; Three.js from CDN)
