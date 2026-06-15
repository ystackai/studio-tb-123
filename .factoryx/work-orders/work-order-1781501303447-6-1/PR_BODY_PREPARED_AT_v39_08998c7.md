# Acid Circuit Breaker — TB-123 Arcade Game (PR#130)

**Preview:** `games/92-acid-circuit-breaker/index.html` (self-contained, first screen playable immediately on load/gesture)

**Work Order:** work-order-1781501303447-6-1 (factory-tb-123 / tb-123)

## Implemented (v39 contact-sheet polish pass)
- Rave-bright reactive 3-lane acid circuit: race, switch polarity (G/P/B), match BOTH lane AND letter/color to shatter gates for score+combo (beat-synced bonuses), dodge glitches (with ! telegraphs), collect pulses for fuel, escalating patterns at level-ups.
- Sharp controls: keyboard (arrows/A-D + SPACE), full-height pointer/touch zones (any Y on canvas or strips), immediate <100ms response with particles + sfx + visuals.
- Scoring/combo: beat-phase multiplier, idle decay to encourage chaining, floating LANE/POLARITY toasts on miss, HUD pops + flash.
- Restart: RETRY from gameover, full pre-seed taste-gate slice always gives 30s of verbs instantly.
- Responsive: 1280x720 landscape playfield in 1380px strong cabinet frame (32px sides + 24px top/bottom bezel labels), scales, mobile full-bleed, large targets.
- Polish v39 (addressing contact-sheet 15:32Z + 11:50/12:18): more horizontal + stronger cab frame (wider landscape + tall bezels + thick borders), enlarged player 128x56/gates 300x42/letters 32px/30px inside, unmistakable match (thick white/yellow rings + 26px BREAK + zap line from ship + arcs), mismatch (red X + cracks on gate + 21px toast + particles + tint), less menu start (lighter overlay + compact CTA).
- All self-contained, <42kB, zero net, gesture audio, 60fps, easing everywhere, no placeholders.

**Game Feel Checklist:** all PASS (see WORKLOG.md).

**Browser verification evidence (real chromium this runtime, post-edit tree):** 
- file:// index.html → acid-start-v39.png (start + full wide cab + bezels).
- file:///.../acid-runtime-check-39.html (driver: startGame + lane+pol+mismatch+shatter+warn+toasts+rings+zap + X visible) → acid-mid-check-39.png (253kB, shows enlarged + unmistakable feedback live).
- Exit 0, bytes written, **no pageerror/timeout**.

**FactoryX Work Order Context**
- Work Order: work-order-1781501303447-6-1
- Full prompt / payload / operator feedback log / PREVIEW / VERIFICATION / WORKLOG / GOAL_EXECUTION_STRATEGY in `.factoryx/work-orders/work-order-1781501303447-6-1/`
- Branch: factoryx/factory-tb-123/work-order-1781501303447-6-1 (this PR)
- Preview entrypoint: games/92-acid-circuit-breaker/index.html
- Completion mode: polish_until_deadline (deadline 2026-06-15T17:32:54Z)

See durable notes in the work order dir for full original prompt, playtest feedback (11:23/11:50/12:18/15:32Z), screenshots, and execution details. The diff is the ambitious playable Acid Circuit Breaker artifact.
