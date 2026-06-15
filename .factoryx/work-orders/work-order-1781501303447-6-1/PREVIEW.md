# Preview - Acid Circuit Breaker

## Preview URL (Canonical)
`games/92-acid-circuit-breaker/index.html`

This is the direct preview root per FactoryX guidelines. Open it in a browser — first screen is the playable game (no interstitial landing page). The games index (`games/index.html`) also links to it as the featured Acid Circuit Breaker card.

## How to Play (First 30 Seconds — No Explanation Needed)

1. Open the page. You see a strong landscape arcade cabinet frame with "ACID CIRCUIT BREAKER" marquee, neon scanlines, and a big "CLICK OR PRESS SPACE" prompt over the circuit.
2. Click anywhere or press Space — instant start. The acid traces scroll, the first gates and glitches approach.
3. **Core verb (Polarity Ride):** 
   - Left/Right (Arrow keys or A/D or click left/right side of cabinet) — switch lanes.
   - Space (or click the big POLARITY button) — flip polarity (A ↔ B). Immediate visual flash + zap sound.
4. Gates have large colored borders + huge polarity letter (A or B). Match your lane + polarity when you "breaker" the gate to score and keep combo. Mismatch or hit a glitch = shock, combo break, visual crack + low buzz.
5. Glowing pulses drift on lanes — ride over them for bonus points (extra bright collect pop + sound).
6. Music: a real acid/rave loop (bassline + drums + stabs) starts on first gesture. It builds energy as your combo/heat rises. Use the MUSIC / SFX buttons (top right of cabinet) to toggle — safe, no breakage.
7. Score + multiplier (x1 → x2 → x4 → x8) shown large at top. Good chains feel punchy with particles and text pops.
8. Survive escalating density and speed. On death: big "CIRCUIT BROKEN" + final score + RESTART button (or press R).

## Controls (All Large Targets)
- **Keyboard:** ←/→ or A/D = lane | Space = polarity flip | R = restart (when over)
- **Pointer:** Click left half of playfield = left lane, right half = right lane; dedicated on-screen POLARITY button (big) for flip. Click MUSIC/SFX toggles.
- Touch: same click targets are thumb-friendly (>=44px).

## Visual / Audio Design
- Rave-bright neon on dark with heavy interference texture (scanlines, noise, ghost traces) per TB-123 "art of the signal".
- Strong cabinet frame for presence and to use horizontal viewport (addresses all prior "too portrait/tiny" feedback).
- Player, gates, polarity letters all large and high-contrast — unmistakable match/mismatch at a glance (color + glyph + flash + particles).
- Music is composed acid/rave (see ASSET_MANIFEST.md): specific 142bpm bassline with slides, full drum kit, harmonic stabs, reactive energy layers driven by your combo. SFX sit on top, distinct.
- Beat-synced: gates/pulses timed to the music grid; good on-beat matches give audible/visual accent + slight score bonus.

## Screenshots / Evidence (to be captured in verification)
- Title + immediate start prompt (first screen playable).
- Mid-run: wide cabinet, large player with polarity letter, approaching gates with big letters, pulses, glitches, active combo + score HUD, music on indicator.
- Match success: bright particle + "PHASE LOCK" popup.
- Mismatch/hit: red crack + "PHASE DRIFT" + combo drop.
- Game over + restart.

## Verification Path (see VERIFICATION.md)
- Open `games/92-acid-circuit-breaker/index.html`
- Click or space → play begins immediately
- Perform lane switch + polarity flip within 2s
- Match at least 3 gates, collect 1 pulse, survive 20s+
- Toggle music off/on
- Hit a glitch or mismatch → see feedback + restart
- Console clean (no errors, no failed fetches)

## Notes
- Self-contained, no network after load.
- Works in modern desktop/mobile browsers (Web Audio + canvas 2D).
- Direct file: or served under `/factoryx/previews/...` trees.
- This replaces prior dance-battle as the active artifact for this Work Order on the shared branch/PR.
