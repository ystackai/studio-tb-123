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

## Polish additions (final pass, visible in first minute of play after pre-seed)
- Gate misses now produce a brief floating "LANE" or "POLARITY" label (red) that rises and fades near the ship — makes the dual-match rule instantly learnable from failure.
- Glitches carry a 250-350ms "!" + accent line warning at the top of their lane before they descend — threat readable without surprise.
- At LVL 2+ the world begins injecting short deliberate patterns (color sequences or lane-locked gates + close glitches). This delivers the "escalating patterns" and "oh shit" moments while the opening 30s remains the reliable curated taste-gate slice.
- Gate success now *shatters*: on correct lane+polarity match the bar vanishes instantly in a burst of circuit arcs and colored particles at the exact crossing point in the lane (stronger on beat-phase). The "breaker" verb has a clear, satisfying pop instead of the gate sliding past after score. Directly addresses prior note that gate success "lacked 'breaker' satisfaction".
All still fits the TB-123 "signal that arrives changed / interference as character" frame: the patterns are like fading transmissions or jamming bursts you have to ride. The shatter is the moment of coherence.

Screenshots in this dir's screenshots/ (v3 + v4 rework pass) show the post-polish runtime with shatter fx live in mid-play caps.


## Latest Verification Evidence (v17 re-confirmation, HEAD 26f54d9 / fbc882e at start of pass)
- Fresh chromium file:// + acid-runtime-check-6.html instrumented repro + direct committed index both produced valid 440x760 PNGs (acid-start-v17-repro.png 67479B, acid-mid-check-6-repro-v17.png 110029B) in <2s with no timeout/pageerror under current post-zellij-scrub env.
- Post-interaction state exercised (lane switch + polarity cycle + pre-seed + mismatch toast + glitch warning + final shatter arcs).
- Confirms the immediate `render();` fix (```299:301:games/92-acid-circuit-breaker/index.html```) + pre-seed makes the playable first screen + in-game state synchronously available for any harness.
- All Game Feel items re-PASS. No game code change. PR#130 updated on canonical branch.
