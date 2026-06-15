# PR Body for Acid Circuit Breaker — v33 layout enlargement (targeted rework for playtest feedback)

**Work Order:** work-order-1781501303447-6-1  
**Factory:** factory-tb-123 / tb-123  
**Branch:** factoryx/factory-tb-123/work-order-1781501303447-6-1 (PR #130)  
**Preview:** `games/92-acid-circuit-breaker/index.html` (direct, first screen playable)  
**Changes in this push:** code + evidence only for the required enlargement/clarity pass. No pure metadata.

## Summary of Changes (addressing operator blocking feedback)

- **Root cause of "tiny / narrow" complaint:** fixed 400x700 canvas + 420px max container + small sprite constants (player 32x20, thin 12px gates, 9px letters) produced a boxed handheld that didn't scale with viewport.
- **Fix (this diff):** 
  - Logical playfield 540x900, container max 620px, aspect updated, mobile full-bleed, larger HUD/fonts/buttons.
  - All gameplay sprites enlarged (player ~50x30 with *bold polarity letter rendered inside the ship body*, gates 24px tall 140px wide with 15px bold letters in center, glitches/pulses scaled).
  - Polarity state is now unmistakable at a glance: letter on ship + letter on every gate + enlarged bottom indicator + color + reactive wash.
  - Preserved the "neon handheld" CRT aesthetic, scanlines, rave glows, pre-seed taste-gate slice, immediate sync render on start, full controls, beat-synced shatters, toasts for LANE/POLARITY misses, etc.
- **Why this, not polish-only:** Explicit "enlarge the player/gates", "use the viewport more confidently", "make polarity matching unmistakable" + "Do not spend the pass only on PR metadata".
- **Evidence:** fresh chromium file:// renders (start + instrumented post-interaction with lane/pol/shatter exercised) on the exact committed file + matching check-N repro. 104kB PNGs at 620x1030 showing the larger elements. See VERIFICATION.md + screenshots/acid-*-v32-repro.png + acid-runtime-check-32.html.

This keeps the core loop (race acid lanes, match lane *and* polarity to break gates for combo/score, dodge glitches, collect pulses) rave-bright, reactive, and now *legible and confident* in the viewport.

All prior Game Feel / taste-gate / self-contained / no-net items re-PASS at the new scale. First screen playable with no explanation needed; actions <100ms with punchy feedback.

## Files changed
- `games/92-acid-circuit-breaker/index.html` (the playable artifact; constants, CSS, draw code, pre-seed, canvas attrs)
- `.factoryx/work-orders/work-order-1781501303447-6-1/{PREVIEW,VERIFICATION,WORKLOG}.md` (append-only evidence + notes)
- `.factoryx/work-orders/work-order-1781501303447-6-1/screenshots/acid-start-v32-repro.png`
- `.factoryx/work-orders/work-order-1781501303447-6-1/screenshots/acid-mid-check-32-repro.png`
- `.factoryx/work-orders/work-order-1781501303447-6-1/acid-runtime-check-32.html`
- `.factoryx/work-orders/work-order-1781501303447-6-1/acid-check-32.HEAD`
- this PR_BODY_PREPARED...

## Before / After (from verification caps)
- Before: narrow 420px frame, tiny ship, thin gates, 9px letters — hard to read polarity or lane intent on desktop/mobile.
- After: 620px frame commanding more space, big ship with letter "G/P/B" inside, tall colored gate bars with big letters, clear bottom pol pip. Same neon/CRT/rave soul, instantly clearer rules.

## GitHub Work Order Context

See the full Work Order prompt (including Payload JSON with operator_playtest_feedback_log, goal, deadline 2026-06-15T14:28:32Z, preview entrypoint, etc.) in the work order dir or attached below for reviewers.

```
FactoryX Work Order
id: work-order-1781501303447-6-1
factory_id: factory-tb-123
project_id: tb-123
role_id: coder-default
runtime_profile: grok-build
title: Acid Circuit Breaker

Description:
Build an ambitious, polished TB-123 arcade game called Acid Circuit Breaker. Start from the studio repository and its existing assets/style; first screen must be playable. The core should feel rave-bright and reactive: race along acid circuit lanes, switch colors/polarity, dodge glitches, collect pulses, chain beat-synced score multipliers, and survive escalating patterns. Implement immediately, then polish until the deadline: sharp controls, scoring/combo feedback, restart, responsive layout, browser verification evidence, screenshots, and a GitHub PR with preview. Avoid static posters and placeholder demos.

Operator blocking playtest feedback - 2026-06-15T11:23Z: ... (preserve neon handheld, push clarity, immediate, unmistakable, punchy)
Operator blocking playtest feedback - 2026-06-15T11:50Z: ... (use viewport confidently, enlarge player/gates, polarity unmistakable)

[full Payload JSON, WORKFLOW.md, and instructions as in the launching <user_query> — see .factoryx/work-orders/work-order-1781501303447-6-1/ and the checkout root for exact files at time of this PR]
```

**PR update instruction (for self):** Update PR #130 body with the above + any CI/deploy notes. Keep one canonical PR. Use the branch guard rules.

**Live preview root:** games/92-acid-circuit-breaker/index.html (opens the game directly).

**Known at push:** gh API auth limited in worker (used git push + prepared body per prior successful pattern); all evidence generated in active env post the 11:50 feedback.

