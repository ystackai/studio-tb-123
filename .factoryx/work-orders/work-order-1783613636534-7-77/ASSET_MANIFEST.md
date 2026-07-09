# Asset Manifest — Rotor Chrome Night Canyon

## Creative Intent
"This should feel like piloting a tiny stealth helicopter through a moonlit slot canyon while a four-on-the-floor house track builds — each signal pylon you collect adds a new musical layer until the canyon floods with chrome light."

## Foundry Jobs

### 1. cozy_audio_pack (Music + SFX)
- **Recipe**: `cozy_audio_pack`
- **Job ID**: `asset-1783613901596-39044748`
- **Asset Name**: `rotor_chrome_audio`
- **Request JSON**: `{"recipe":"cozy_audio_pack","asset_name":"rotor_chrome_audio","prompt":"Dark French-house four-on-the-floor loop at 128 BPM with deep sub-bass, punchy kick, filtered saw chords, and atmospheric pads. SFX: rotor blade whoosh, radar gate beep, signal pylon pickup chime, danger proximity alarm, and a bright reveal sting for the final chord bloom moment.","style":"dark french house"}`
- **Duration**: 3.62s
- **Review**: passed
- **Copied outputs** (from `/outputs/asset-1783613901596-39044748/...`):
   - `music_v2/foundry_music_loop.wav` → `games/rotor-chrome-night-canyon/assets/generated/foundry_music_loop.wav` (7.1 MB, 41.7s music loop)
   - `sfx_v2/sfx_movement.wav` → `assets/generated/sfx_movement.wav` (128 KB, engine thrust)
   - `sfx_v2/sfx_interaction.wav` → `assets/generated/sfx_interaction.wav` (100 KB, radar gate beep)
   - `sfx_v2/sfx_danger.wav` → `assets/generated/sfx_danger.wav` (107 KB, danger alarm)
   - `sfx_v2/sfx_impact.wav` → `assets/generated/sfx_impact.wav` (142 KB, crash impact)
   - `sfx_v2/sfx_reveal.wav` → `assets/generated/sfx_reveal.wav` (181 KB, reveal sting)
   - `sfx_v2/engine_thrust.wav` → `assets/generated/engine_thrust.wav` (128 KB, rotor movement)
   - `sfx_v2/sonar_ping.wav` → `assets/generated/sonar_ping.wav` (100 KB, pylon ping)
   - `sfx_v2/near_miss_warning.wav` → `assets/generated/near_miss_warning.wav` (107 KB)
   - `sfx_v2/reveal_sting.wav` → `assets/generated/reveal_sting.wav` (181 KB, end-game sting)
   - `music_v2/music_v2_waveform.png` → `assets/generated/music_v2_waveform.png` (5.1 KB)
   - `sfx_v2/sfx_v2_waveforms.png` → `assets/generated/sfx_v2_waveforms.png` (28 KB)

### 2. sonar_contacts (Radar Gate & Pylon Markers)
- **Recipe**: `sonar_contacts`
- **Job ID**: `asset-1783613911481-a3e6ba39`
- **Asset Name**: `radar_gate_markers`
- **Request JSON**: `{"recipe":"sonar_contacts","asset_name":"radar_gate_markers","prompt":"Four glowing radar beacon markers for a midnight canyon flight game: friendly blue gate marker, hostile red danger marker, unknown purple pylon signal, and decoy green waypoint. Each should be a small holographic beacon with phosphor emissive glow, suitable as 3D game pickups and radar gate indicators in a dark canyon environment.","style":"holographic phosphor"}`
- **Duration**: 57.13s
- **Review**: passed
- **Copied outputs** (from `/outputs/asset-1783613911481-a3e6ba39/...`):
   - `sonar_friendly.glb` → `assets/generated/sonar_friendly.glb` (53 KB) — radar gate marker (blue)
   - `sonar_hostile.glb` → `assets/generated/sonar_hostile.glb` (16 KB) — danger marker (red)
   - `sonar_unknown.glb` → `assets/generated/sonar_unknown.glb` (9.5 KB) — signal pylon marker (purple)
   - `sonar_decoy.glb` → `assets/generated/sonar_decoy.glb` (77 KB) — waypoint marker (green)
   - `sonar_contacts_all.glb` → `assets/generated/sonar_contacts_all.glb` (145 KB) — all four combined
   - `sonar_contacts_contact_sheet.png` → `assets/generated/sonar_contacts_contact_sheet.png` (361 KB)
   - `sonar_contacts_poster.png` → `assets/generated/sonar_contacts_poster.png` (280 KB)
   - `sonar_contacts_turntable.gif` → `assets/generated/sonar_contacts_turntable.gif` (1.5 MB)

## Integration Points

### Visual — Foundry GLBs in Active Play
- **sonar_friendly.glb**: Loaded via GLTFLoader as the radar gate markers — 5 gates along the canyon route. The player must fly through each gate. These are the primary gameplay targets, not decorative elements.
- **sonar_unknown.glb**: Loaded via GLTFLoader as signal pylon pickups — 4 pylons scattered along the canyon. Collecting each adds a musical stem and activates a canyon light layer. These are the core music-building mechanic.
- Both GLBs are scaled and positioned at gate/pylon spawn points, attached as children of the procedural gate/pylon structures.

### Audio — Foundry Music + SFX
- **Music**: `foundry_music_loop.wav` (41.7s, 7.1 MB) plays as looping ambience after the user clicks "LAUNCH"
- **SFX mapping** (all from Foundry `sfx_v2/`):
   - Rotor movement → `sfx_movement.wav` (periodic during flight)
   - Radar gate pass → `sfx_interaction.wav` (on each gate fly-through)
   - Signal pylon pickup → `sfx_reveal.wav` (on each collection)
   - Danger/crash → `sfx_danger.wav` (crash end state)
   - Impact → `sfx_impact.wav` (crash impact)
   - End-game reveal → `reveal_sting.wav` (win state)
   - Additional: `engine_thrust.wav`, `sonar_ping.wav`, `near_miss_warning.wav`

### Stem System
- 4 stem slots in HUD, each activated by collecting a signal pylon
- Each stem adds a canyon light layer (colored point lights: green, pink, blue, amber)
- Music gain increases with each stem
- Fog density decreases, exposure increases — canyon visually "blooms" with collected stems

## Total Payload
- **Visual assets**: ~2.4 MB (GLBs + images)
- **Audio assets**: ~8.0 MB (music + 10 SFX + waveforms)
- **Game code**: ~35 KB (HTML + JS modules)
- **Libraries**: 15 GameBlocks modules copied from `.factoryx/skills/gameblocks/`
- **Grand total**: ~11 MB

## Recipe Mismatch Notes
- `sonar_contacts` was designed for NTDS submarine sonar displays, not canyon flight games. The arrow/diamond shapes work well as holographic radar gate markers and signal beacon pylons in the dark canyon aesthetic. The phosphor emissive glow fits the chrome-night theme. This is an honest adaptation, not a generic decoration.
