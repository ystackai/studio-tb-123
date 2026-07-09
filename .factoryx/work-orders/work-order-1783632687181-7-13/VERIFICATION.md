# Verification

## Browser Run

- Browser: bundled Chromium through Playwright, 1440x900 viewport.
- Served URL: `http://127.0.0.1:8767/games/rotor-chrome-night-canyon/index.html`.
- Console errors: 0.
- Page errors: 0.
- Failed requests: 0.
- HTTP responses >= 400: 0.
- Canvas: 1440x900 and visually nonblank after launch.
- Controls: Space boost and lateral steering changed the live flight state.
- Active-play result: score 600, stems 2/4, gates 1/5 at the mid-flight checkpoint.
- Finale result: score 1400, stems 4/4, gates 4/5, `SIGNAL ACQUIRED`.
- Relaunch result: score 0, visible stems 0/4, audio stems 0, gates 0/5.
- Gate scoring includes horizontal and vertical distance from the visible ring center.

## Asset Proof

The browser recorded HTTP 200 for:

- `sonar_friendly.glb`
- `sonar_unknown.glb`
- `foundry_music_loop.wav`
- `sfx_movement.wav`
- `sfx_interaction.wav`
- `sfx_reveal.wav`
- `sfx_danger.wav`
- `sfx_impact.wav`
- `reveal_sting.wav`

Machine-readable request, state, and error evidence is in `browser-evidence.json`. Screenshots are in `screenshots/`.
