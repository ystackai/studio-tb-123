# ASSET MANIFEST — Pocket Signal Machine

## Foundry Jobs

### Job 1: cozy_audio_pack
- **Recipe**: cozy_audio_pack
- **Job ID**: asset-1783603634917-6be37767
- **Asset Name**: pocket-signal-machine
- **State**: completed (passed review)
- **Request JSON**: {"recipe":"cozy_audio_pack","asset_name":"pocket-signal-machine","prompt":"Lo-fi electronic pocket instrument: warm synth pads, crisp percussion hits (kick, snare, hihat, clap), a deep bass loop, and short percussive SFX for pad triggers and knob interactions. Think Teenage Engineering meets vintage modular.","style":"lo-fi electronic, warm analog, tactile"}

### Copied /outputs paths → Game paths
| Foundry Output | Game Path | Use |
|---|---|---|
| music_v2/foundry_music_loop.wav | assets/audio/music_loop.wav | Background music loop (0.12 gain ambience) |
| sfx_v2/sfx_interaction.wav | assets/audio/sfx_interaction.wav | Clap pad SFX layer |
| sfx_v2/sfx_impact.wav | assets/audio/sfx_impact.wav | Kick, snare, tom pad SFX layer |
| sfx_v2/sfx_movement.wav | assets/audio/sfx_movement.wav | Hihat, rim, bass pad SFX layer |
| sfx_v2/sfx_danger.wav | assets/audio/sfx_danger.wav | (available for future hazard integration) |
| sfx_v2/sfx_reveal.wav | assets/audio/sfx_reveal.wav | Payoff moment layer |
| sfx_v2/sfx_payoff.wav | assets/audio/sfx_payoff.wav | Chain complete payoff sound |
| sfx_v2/pickup_chime_bright.wav | assets/audio/sfx_chime.wav | Lead pad SFX layer |
| music_v2/music_v2_waveform.png | assets/visual/music_waveform.png | Decorative waveform display |
| sfx_v2/sfx_v2_waveforms.png | assets/visual/sfx_waveforms.png | (reference visual) |

### Stats
- Music duration: 30.97s
- SFX count: 8 loaded, 4+ unique
- Total payload: ~6MB (audio dominant)

## Integration Points
1. **Music loop**: Starts on POWER ON, plays continuously at low volume (0.12 gain)
2. **Pad SFX**: Each pad triggers a foundry SFX layered over procedural Web Audio synthesis
3. **Payoff SFX**: Chain completion fires sfx_payoff + sfx_reveal simultaneously
4. **Waveform visual**: music_waveform.png rendered as subtle background decoration

## Verification Evidence
- All 10 assets confirmed HTTP 200 from local server
- All audio files >8KB, music >1MB — within foundry review contract
- Asset review state: passed (no errors, no warnings)
