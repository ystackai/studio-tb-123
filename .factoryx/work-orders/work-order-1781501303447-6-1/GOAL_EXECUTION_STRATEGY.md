# GOAL EXECUTION STRATEGY — Acid Circuit Breaker

Work Order goal (verbatim excerpt):
"Build an ambitious, polished TB-123 arcade game called Acid Circuit Breaker. Start from the studio repository and its existing assets/style; first screen must be playable. The core should feel rave-bright and reactive: race along acid circuit lanes, switch colors/polarity, dodge glitches, collect pulses, chain beat-synced score multipliers, and survive escalating patterns. Implement immediately, then polish until the deadline: sharp controls, scoring/combo feedback, restart, responsive layout, browser verification evidence, screenshots, and a GitHub PR with preview. Avoid static posters and placeholder demos."

## Constraints & Non-Goals (from WORKFLOW + prompt)
- Taste-gate first: 30-60s playable slice of **one verb in one space** before broad systems. (We have the slice; now tighten feel.)
- No save/load, inventory, multiple levels, procgen, broad settings, achievements unless asked.
- Single self-contained index.html preferred.
- Preview root = the game itself (games/92-acid-circuit-breaker/index.html).
- Real browser verification (pageerror/console + post-interaction state) is mandatory; failures block.
- completion_mode=polish_until_deadline → continue improving the same artifact/PR past "reviewable" until 2026-06-15T14:28:32Z or hard blocker.
- Stay inside TB-123 house style (signal/interference, warm/cold analog, noise as texture, callsign fragments, moment of coherence) while delivering the requested "rave-bright" energy. Neon + glitch + circuit fits; do not make generic clean arcade.

## Strategy
1. **Respect the slice that already exists.** The polarity+lane dual match + dodge/collect is the verb. Do not expand to new verbs or scenes.
2. **Polish the feel aggressively** (controls, timing feedback, visual reactivity, "breaker" satisfaction) because that is what makes the slice *interesting* vs. mediocre.
3. **Use small, reviewable diffs** for riskier changes (e.g. spawn rhythm changes); larger cohesive passes when the direction is clear from play.
4. **Verification is part of the deliverable.** Every polish push should be accompanied by fresh browser evidence in the work order dir + updated PR body.
5. **One canonical PR.** Update #130 in place. Rebase/merge main only if needed to stay current; never push other FactoryX branches.
6. **Stop only on deadline or blocker.** If something is "good enough for review" but we still have time and a clear improvement, do the improvement.

## Success Criteria (beyond the prompt's Game Feel list)
- A new player can explain the core rule ("match lane *and* color by flipping polarity") after 20s of play without reading the hint.
- Every action (lane, flip, collect, break, die) has immediate distinct audiovisual response.
- On higher levels the density and speed create "oh shit" moments but the telegraphing and prior ramp give the player a chance.
- Touch play feels as crisp as keyboard.
- The game still feels "TB-123" — the gates feel like fragile transmissions you have to tune yourself to receive cleanly.

## What "Ambitious but Focused" Means Here
Ambitious = the dual-state match + beat-reactive world + satisfying break moments + escalating survival tension, all in one tight file.
Not ambitious = adding powerups, multiple ships, story screens, settings menu, leaderboards, or a second mode.

Execute, verify, push, repeat until budget exhausted.
