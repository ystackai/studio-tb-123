# PREVIEW — Acid Circuit Breaker

**Entrypoint:** `games/92-acid-circuit-breaker/index.html` (self-contained, direct playable first screen)

**Live preview (after deploy):** Will be under the FactoryX preview tree, e.g. https://www.ystackai.com/factoryx/tb-123/previews/... but the canonical artifact is the committed index.html.

**How to open locally:**
- `python -m http.server` then visit /games/92-acid-circuit-breaker/index.html
- Or just open the file in any modern browser (file:// works for this; audio requires a gesture anyway).

**What the first screen shows (no extra explanation needed):**
- Bold neon title "ACID CIRCUIT BREAKER" pulsing.
- One-sentence hook + control legend.
- Big green START button (TB-123 accent).
- On START: immediate drop into the circuit with pre-placed gates, a glitch, and pulses so you can act in <5s.

**Core loop visible in 20-40s:**
- Ship (colored by your current polarity) racing down 3 acid circuit traces.
- Use left/right (or side taps) to change physical lane.
- Use center tap / SPACE to cycle polarity (G green / P magenta / B blue).
- Gates descend; to "break" one for score + combo you must be in its lane *and* have matching polarity when it crosses your ship.
- Wrong match just drops your combo (no death).
- Glitches kill on contact — dodge.
- Gold pulses are collectible combo fuel.
- Everything pulses to an internal beat; background wash tints to your current polarity.
- Level/speed ramp via distance; score and max combo tracked.
- Die → see score + best combo → RETRY (re-seeds a fresh slice).

**Screenshots (captured during verification):**
- See VERIFICATION.md and the run's object-store artifacts for annotated browser renders of:
  - Start screen (title + call to action)
  - Mid-play (after polarity flip + lane change + gate interaction + HUD + particles visible)
  - Game over state

**Technical notes for reviewers:**
- 400×700 internal canvas, responsive container (aspect-ratio + max-width, mobile full-bleed).
- Zero external requests. Works offline post first load.
- All assets procedural + inline styles/JS.
- Tested interaction paths: keyboard, pointer (desktop), touch zones (mobile).

This is the playable artifact. No poster, no placeholder, no "coming soon".
