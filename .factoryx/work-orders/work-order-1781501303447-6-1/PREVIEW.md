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
## Latest Verification Evidence (v18 re-confirmation, HEAD 0b93d30246b4c1edb711e7599b2eb220bf9f644a)
- Fresh chromium file:// + acid-runtime-check-6.html instrumented repro + direct committed index both produced valid 440x760 PNGs (acid-start-v18-repro.png 67544B, acid-mid-check-6-repro-v18.png 104410B) in <3s with no timeout/pageerror under current post-zellij-scrub env.
- Post-interaction state exercised (lane switch + polarity cycle + pre-seed + mismatch toast + glitch warning + final shatter arcs).
- Confirms the immediate `render();` fix (```299:301:games/92-acid-circuit-breaker/index.html```) + pre-seed makes the playable first screen + in-game state synchronously available for any harness.
- All Game Feel items re-PASS. No game code change. PR#130 updated on canonical branch.
## Latest Verification Evidence (v19 re-confirmation, HEAD 5326b5ddea58ecf25ae7a67576c553fa6c766f0c)
- Fresh chromium file:// + acid-runtime-check-6.html instrumented repro + direct committed index both produced valid 440x760 PNGs (acid-start-v19-repro.png 67567B, acid-mid-check-6-repro-v19.png 102776B) in <2s with no timeout/pageerror under current post-zellij-scrub env.
- Post-interaction state exercised (lane switch + polarity cycle + pre-seed + mismatch toast + glitch warning + final shatter arcs).
- Confirms the immediate `render();` fix (```299:301:games/92-acid-circuit-breaker/index.html```) + pre-seed makes the playable first screen + in-game state synchronously available for any harness.
- All Game Feel items re-PASS. No game code change. PR#130 updated on canonical branch.

## Latest Verification Evidence (v20 re-confirmation, HEAD 2a6cecc4e8df9ad54d04051e263a5487b1bde574 at start of pass)
- Fresh chromium file:// + acid-runtime-check-6.html instrumented repro + direct committed index both produced valid 440x760 PNGs (acid-start-v20-repro.png 67544B, acid-mid-check-6-repro-v20.png 108200B) in <3s with no timeout/pageerror under current post-143-failure runtime.
- Post-interaction state exercised (lane switch + polarity cycle + pre-seed + mismatch toast + glitch warning + final shatter arcs).
- Confirms the immediate `render();` fix (```299:301:games/92-acid-circuit-breaker/index.html```) + pre-seed makes the playable first screen + in-game state synchronously available for any harness.
- All Game Feel items re-PASS. No game code change. PR#130 updated on canonical branch.
- This pass directly addresses the launch prompt's "Previous run issue to address before peripheral polish: agent runner failed: grok exited with status 143" (the truncated-thoughts kill during task start) by completing the full verification + evidence in the active env before PR body refresh.

## Latest Verification Evidence (v21 re-confirmation, HEAD 66ebc4b2f2180584892d43c6e1b0d1b18214a71e at start of pass)
- Fresh chromium file:// + acid-runtime-check-21.html instrumented repro (IIFE driver) + direct committed index both produced valid 440x760 PNGs (acid-start-v21-repro.png 67710B, acid-mid-check-21-repro.png 75608B) in <4s with no timeout/pageerror under current post-verifier-image-rollout env.
- Post-interaction state exercised (lane switch + polarity cycle + pre-seed + mismatch toast + glitch warning + final shatter arcs).
- Confirms the immediate `render();` fix (```299:301:games/92-acid-circuit-breaker/index.html```) + pre-seed makes the playable first screen + in-game state synchronously available for any harness.
- All Game Feel items re-PASS. No game code change. PR#130 updated on canonical branch.
- This pass directly addresses the launch prompt's "Previous run issue to address before peripheral polish: redeploy reset after verifier image rollout" by completing the full verification + evidence in the active env before PR body refresh.


## Latest Verification Evidence (v22 re-confirmation, HEAD af46a9e5c3d4712653e75816dfc74352fd7b5ea6 at start of pass)
- Fresh chromium file:// + acid-runtime-check-22.html instrumented repro (IIFE driver) + direct committed index both produced valid 440x760 PNGs (acid-start-v22-repro.png 67681B, acid-mid-check-22-repro.png 107123B) in <5s with no timeout/pageerror under current post-verifier-image-rollout env.
- Post-interaction state exercised (lane switch + polarity cycle + pre-seed + mismatch toast + glitch warning + final shatter arcs).
- Confirms the immediate `render();` fix (```299:301:games/92-acid-circuit-breaker/index.html```) + pre-seed makes the playable first screen + in-game state synchronously available for any harness.
- All Game Feel items re-PASS. No game code change. PR#130 updated on canonical branch.
- This pass directly addresses the launch prompt's "Previous run issue to address before peripheral polish: redeploy reset after verifier image rollout" by completing the full verification + evidence in the active env before PR body refresh.

## Latest Verification Evidence (v23 re-confirmation, HEAD a4bb03cc0b574896164960eecfdb29c4e6565dc6 at start of pass)
- Fresh chromium file:// + acid-runtime-check-23.html instrumented repro (IIFE driver, git-show pristine base) + direct committed index both produced valid 440x760 PNGs (acid-start-v23-repro.png 67535B, acid-mid-check-23-repro.png 75216B) in <3s with no timeout/pageerror under current post-verifier-image-rollout / redeploy env.
- Post-interaction state exercised (lane switch + polarity cycle + pre-seed + mismatch toast + glitch warning + final shatter arcs).
- Confirms the immediate `render();` fix (```299:301:games/92-acid-circuit-breaker/index.html```) + pre-seed makes the playable first screen + in-game state synchronously available for any harness.
- All Game Feel items re-PASS. No game code change. PR#130 updated on canonical branch.
- This pass directly addresses the launch prompt's "Previous run issue to address before peripheral polish: redeploy reset after verifier image rollout" by completing the full verification + evidence in the active env before PR body refresh. (Also staged the v23 pngs + confirmed v22 pair present in tree per a4bb03c recovery intent.)

## Latest Verification Evidence (v24 re-confirmation, HEAD 4bead47d538506a205541d6c6f294fd8995de9fe at start of pass)

- Fresh chromium file:// + acid-runtime-check-24.html instrumented repro (IIFE-scope driver via git-show pristine base) + direct committed index both produced valid 440x760 PNGs (acid-start-v24-repro.png 67469B, acid-mid-check-24-repro.png 104252B) in <3s with no timeout/pageerror under current post-verifier-image-rollout / redeploy env.
- Post-interaction state exercised (lane switch + polarity cycle + pre-seed + mismatch toast + glitch warning + final shatter arcs).
- Confirms the immediate `render();` fix (```299:301:games/92-acid-circuit-breaker/index.html```) + pre-seed makes the playable first screen + in-game state synchronously available for any harness.
- All Game Feel items re-PASS. No game code change. PR#130 updated on canonical branch.
- This pass directly addresses the launch prompt's "Previous run issue to address before peripheral polish: redeploy reset after verifier image rollout" by completing the full verification + evidence in the active env before PR body refresh. (Staged the v24 pngs for the redeploy pipeline.)

