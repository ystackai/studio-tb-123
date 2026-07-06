# Asset Manifest — Bunny Orbit

**Work Order:** work-order-1783368184543-7-1
**Game:** games/bunny-orbit/

## Foundry Jobs

### 1. Bunny Astronaut (3D Visual)
- **Job ID:** `asset-1783373200623-845fb358`
- **Recipe:** `bunny_companion`
- **Recipe Path:** `/asset-foundry/recipes/bunny_companion.py`
- **Request JSON:** `{"recipe":"bunny_companion","asset_name":"bunny_astronaut","prompt":"Cute white bunny wearing a small astronaut helmet and space suit, friendly expression, stylized game-ready 3D character, clean topology for animation, soft rounded proportions","style":"cute-stylized-game-ready"}`
- **State:** completed (86.33s)
- **Review:** passed (no errors, no warnings)
- **GLB bytes:** 2,038,380

#### Copied from /outputs/

| Source (/outputs/.../path) | Destination |
|---|---|
| `asset-1783373200623-845fb358/bunny_companion.glb` | `games/bunny-orbit/assets/generated/bunny_companion.glb` |
| `asset-1783373200623-845fb358/bunny_companion_contact_sheet.png` | `games/bunny-orbit/assets/generated/bunny_companion_contact_sheet.png` |
| `asset-1783373200623-845fb358/bunny_companion_poster.png` | `games/bunny-orbit/assets/generated/bunny_companion_poster.png` |
| `asset-1783373200623-845fb358/bunny_companion_turntable.gif` | `games/bunny-orbit/assets/generated/bunny_companion_turntable.gif` |
| `asset-1783373200623-845fb358/textures/bunny_fur_albedo.png` | `games/bunny-orbit/assets/generated/textures/bunny_fur_albedo.png` |
| `asset-1783373200623-845fb358/textures/bunny_fur_height.png` | `games/bunny-orbit/assets/generated/textures/bunny_fur_height.png` |
| `asset-1783373200623-845fb358/textures/bunny_fur_normal.png` | `games/bunny-orbit/assets/generated/textures/bunny_fur_normal.png` |
| `asset-1783373200623-845fb358/textures/bunny_fur_roughness.png` | `games/bunny-orbit/assets/generated/textures/bunny_fur_roughness.png` |

#### Integration
- Loaded via `THREE.GLTFLoader` in `index.html`
- Scaled 1.5x, rotated to Z-up, shadow casting enabled
- Falls back to procedural bunny if GLB fails to load
- **This is the visible protagonist** — the bunny astronaut orbit-hops between planets

### 2. Audio Pack (Music + SFX)
- **Job ID:** `asset-1783373207163-53f11a64`
- **Recipe:** `cozy_audio_pack`
- **Recipe Path:** `/asset-foundry/recipes/cozy_audio_pack.py`
- **Request JSON:** `{"recipe":"cozy_audio_pack","asset_name":"bunny_orbit_audio","prompt":"Gentle wonder space adventure - soft ambient loop music, rocket thrust rumble SFX, cushioned landing thud, bright payoff chime, cute bunny astronaut sounds","style":"cozy-wonder-space"}`
- **State:** completed (3.39s)
- **Review:** passed (no errors, no warnings)
- **Music duration:** 30.97s
- **SFX count:** 4 (meets minimum)

#### Copied from /outputs/

| Source (/outputs/.../path) | Game SFX Role |
|---|---|
| `asset-1783373207163-53f11a64/music_v2/foundry_music_loop.wav` | Background music loop (15% volume) |
| `asset-1783373207163-53f11a64/sfx_v2/sfx_movement.wav` | Thrust rumble (held) |
| `asset-1783373207163-53f11a64/sfx_v2/soft_impact_puff.wav` | Cushioned landing |
| `asset-1783373207163-53f11a64/sfx_v2/sfx_payoff.wav` | Carrot Moon arrival chime |
| `asset-1783373207163-53f11a64/sfx_v2/sfx_reveal.wav` | Debrief reveal |
| `asset-1783373207163-53f11a64/sfx_v2/sfx_interaction.wav` | (reserve) |
| `asset-1783373207163-53f11a64/sfx_v2/sfx_impact.wav` | (reserve) |
| `asset-1783373207163-53f11a64/sfx_v2/sfx_danger.wav` | (reserve) |
| `asset-1783373207163-53f11a64/sfx_v2/bunny_hop_plush.wav` | Planet landing bounce |
| `asset-1783373207163-53f11a64/sfx_v2/pickup_chime_bright.wav` | Planet visit chime |
| `asset-1783373207163-53f11a64/sfx_v2/ui_confirm_glass.wav` | (reserve) |
| `asset-1783373207163-53f11a64/music_v2/cozy_bunny_tracker_loop_v2.wav` | (reserve) |
| `asset-1783373207163-53f11a64/music_v2/music_v2_waveform.png` | Reference image |
| `asset-1783373207163-53f11a64/sfx_v2/sfx_v2_waveforms.png` | Reference image |

#### Integration
- Audio starts only after user gesture (click "Launch!")
- Music loop plays at 15% gain via WebAudio API
- Thrust SFX throttled to every 800ms during thrust hold
- Landing SFX plays on planet touch + bounce SFX
- Payoff chime + reveal SFX on Carrot Moon arrival

## Payload

- **Total generated assets:** ~18 MB
- **Music:** 5.3 MB WAV
- **GLB:** 2.0 MB
- **Textures:** ~1 MB
- **SFX:** ~800 KB total

## Verification Evidence

- Title screen screenshot: `screenshot-title.png` (25KB)
- No 404 asset requests during page load
- No JavaScript console errors in Chromium headless test
- All foundry assets loaded from real files under `games/bunny-orbit/assets/generated/`

## Foundry Blocks Used

| Module | Purpose |
|---|---|
| `game-loop.js` | Fixed-dt pattern for physics |
| `input.js` | Buffered input pattern |
| `tween.js` | Easing for camera follow |
| `particles.js` | Pooled burst pattern for thrust |
| `rng.js` | Seeded RNG for variation |
| `screen-shake.js` | Trauma-based shake on landing |
| `scenes.js` | State machine (title → play → debrief) |
