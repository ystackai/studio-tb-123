# Bunny One

A bunny astronaut orbit-hops to the carrot moon. Hold to burn, release to
drift — timing is aiming: landed ships ride their planet's rotation, so
your launch direction sweeps like a clock hand.

**Intent:** small and brave in a big gentle sky — a held breath during the
burn, weightless relief in the drift, a soft giggle when you land.

Built as the FactoryX eval ladder's anchor artifact (see
`docs/auto-learn-plan.md` in FactoryX) by Claude through the anchor
protocol, passing the production browser critic
(audio_active=true, canvas_variance=582).

## Provenance
- 3D bunny: asset-foundry `bunny_companion`, job `asset-1783363514871-7e14b70d`
  (shipped embedded as `vendor/bunny_data.js` — fetch() is blocked under
  the critic's file:// wrapper)
- Music + SFX: asset-foundry `cozy_audio_pack`, job `asset-1783363514823-41d31ec1`
  (SFX embedded as `vendor/sfx_data.js`; music loop via native <audio>)
- three.js r161 vendored with import-patched GLTFLoader closure
- Headless feel-test hook: `window.__bunnySim` (deterministic sim steps)
- Inspect camera: `?inspect=1`

## Run
Serve the folder over http (`python3 -m http.server`) or open
`index.html` — both protocols supported by design.
