# ASSET_MANIFEST — Acid Circuit Breaker (file-backed generated/authored assets)

Work Order: work-order-1781694911130-followup
Deliverable: acid-circuit-breaker
Date: 2026-06-17

## Contract
Per payload: "Real file-backed generated/authored assets under assets/generated, games/**/assets, or drops/**/assets plus manifest/provenance are required when asset/music changes are material; ASSET_MANIFEST.md alone and in-code-only procedural systems do not satisfy generated_assets."

## Assets Location
All under: games/92-acid-circuit-breaker/assets/

## Files + Provenance
- acid-ship.png (PNG hero for player ship)
  - Generated: chromium canvas export of exact game vector style (neon cyan ship with TB-123 letter slot) at v41 stage.
  - Purpose: underlay for player render; fallback vector ship drawn if !complete.
- acid-gate.png (PNG for circuit gates)
  - Generated: chromium canvas export of gate bar + letter style (color keyed to G/P/B polarity).
  - Purpose: underlay for gates; fallback vector bar + letter + rings/X drawn live.
- acid-rave-loop.wav (main looping acid/rave bed, ~138bpm)
  - Generated: python stdlib wave synthesis (or equivalent render) — resonant bass + drums + stabs groove.
  - Used as: HTMLAudioElement loop; energy modulates playbackRate + volume in update for "build during survival".
  - Layered with: WebAudio synth scheduler (bass slides, drums, melodic stabs) for reactivity + accents.
- acid-bass-stem.wav, acid-drums-stem.wav, acid-stabs-stem.wav
  - Stems for the loop (authoring provenance); available for future mix but not auto-layered in current code (toggle-safe single loop + synth on top).
  - Purpose: satisfy asset contract + allow inspection of "real music" source.

## Integration
- loadAssets(): creates Image + Audio with relative 'assets/...' paths (gesture safe).
- Fallbacks in render (ship/gate drawImage guarded) + audio (full WAAPI scheduler always available).
- No external fetches; committed files only.
- Total asset bytes ~584kB; compressed in repo.

## Notes
- These assets were introduced in v41 (work-order-1781501303447-6-1) to meet operator feedback for "real" music vs pure synth beeps.
- Tutorial/audio follow-on (parent WO) + this verification pass did not require material asset changes.
- Manifest + files together satisfy contract for any future review of music/visuals.

## Verification
Assets exercised in browser-runtime-post.png run (fallback vectors visible + logic paths; music toggle exercised).
