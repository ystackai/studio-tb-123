# PR Body for Acid Circuit Breaker — v35 cabinet/horizontal enlargement + polarity rings (addressing 12:18Z blocking playtest + re-confirmation on check-35 path)

**Work Order:** work-order-1781501303447-6-1  
**Factory:** factory-tb-123 / tb-123  
**Branch:** factoryx/factory-tb-123/work-order-1781501303447-6-1 (PR #130)  
**Preview:** `games/92-acid-circuit-breaker/index.html` (direct, first screen playable, no poster)  
**Changes in this push:** game code (targeted layout + cab + clarity per 12:18Z) + fresh browser runtime evidence (check-35 on exact prior timeout pattern) + PREVIEW/VERIF/WORKLOG + this prepared body. Keeps the PR current under polish_until_deadline.

## Summary (addresses launch prompt + latest blocking operator feedback)
- **12:18Z blocking playtest feedback addressed (this code diff):** "TB-123 post-input playtest: responsive and more game-like, but still constrained to a portrait arcade lane and some gates/player elements are tiny. Next pass should use more horizontal viewport or a stronger cabinet frame, enlarge ship/gates, and make polarity match/mismatch feedback unmistakable."
  - **More horizontal + stronger cab:** new `#cabinet` flex frame (max 920px) with 42px side panels (vertical TB-123/92 labels, dark bezel) + game-container now 820px max (was 620), 720×960 internal canvas (wider 240px lanes), 4px+ inset border + stronger glows. Mobile collapses sides cleanly. Uses viewport confidently while the "neon handheld" strong lane (11:23) is preserved as the glowing cab screen.
  - **Enlarged:** PLAYER 68×40 (20px bold letter inside), GATE 180×30 bars, GLITCH 64×30, PULSE 13. Pre-seed + all positions retuned.
  - **Polarity match/mismatch unmistakable at a glance:** 20px ship letter + 18px gate letters; **live pol-match ring** on gates (yellow if pol matches current ship, white+thick if lane+pol both) so you see "this gate is breakable with my setting" before it crosses; mismatch now emits red particles at gate + the LANE/POLARITY toast.
- **Previous run issue (check-7 timeout) re-addressed:** reproduced literal failure mode with acid-runtime-check-35.html + file:// chromium on guard HEAD; both start and instrumented mid (post lane/pol + pre-seed + mismatch + shatter) produced full 880×1200 PNGs fast, exit 0, **no timeout/no pageerror**. The sync `render();` + pre-seed (```299:301:games/92-acid-circuit-breaker/index.html```) + driver keeps it solid.
- 11:23Z respected: core rave neon + CRT + interference + handheld cab aesthetic kept and strengthened.
- Evidence: acid-start-v35-repro.png (157kB), acid-mid-check-35-repro.png (212kB), acid-runtime-check-35.html, acid-check-35.HEAD (dddd481 at verification start), updated md logs.
- All Game Feel PASS; first screen playable <5s; self-contained 34.5kB; zero net; gesture audio; kb+pointer+touch; 60fps.

The ambitious TB-123 arcade core (acid lanes, polarity switch to break, dodge, collect, beat chain, escalating) is now larger, clearer, and uses the viewport + cab frame per the latest operator note. Same PR/branch.

## Files changed (this push)
- `games/92-acid-circuit-breaker/index.html` (v35 layout/cabinet/enlarge + pol rings + miss particles; ~2.5kB diff focused)
- `.factoryx/work-orders/work-order-1781501303447-6-1/{PREVIEW,VERIFICATION,WORKLOG}.md` (v35 sections + evidence)
- `.factoryx/work-orders/work-order-1781501303447-6-1/screenshots/acid-start-v35-repro.png`
- `.factoryx/work-orders/work-order-1781501303447-6-1/screenshots/acid-mid-check-35-repro.png`
- `.factoryx/work-orders/work-order-1781501303447-6-1/acid-runtime-check-35.html`
- `.factoryx/work-orders/work-order-1781501303447-6-1/acid-check-35.HEAD`
- this PR_BODY_PREPARED...md

## GitHub Work Order Context (verbatim prompt excerpt for reviewers)

See the full Work Order prompt (including Payload JSON with operator_playtest_feedback_log, goal, deadline 2026-06-15T14:28:32Z, preview entrypoint, browser_runtime_verification:true, completion_mode:"polish_until_deadline", etc.) attached below / in the work order dir at time of push.

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

Operator blocking playtest feedback - 2026-06-15T11:23Z: Blocking playtest feedback from the 11:23 UTC public preview: the neon handheld action is one of the strongest lanes. Preserve the core look and push clarity: immediate action after click/space, unmistakable polarity/lane switching, and punchy combo/reward feedback. Do not spend the pass only on PR metadata or verification notes.

Operator blocking playtest feedback - 2026-06-15T11:50Z: TB-123 after-input playtest: the neon polarity lane game is responsive and promising, but it is boxed into a narrow portrait panel with tiny ship/gates. Next pass should use the viewport more confidently, enlarge the player/gates, and make polarity matching unmistakable at a glance.

Operator blocking playtest feedback - 2026-06-15T12:18Z: TB-123 post-input playtest: responsive and more game-like, but still constrained to a portrait arcade lane and some gates/player elements are tiny. Next pass should use more horizontal viewport or a stronger cabinet frame, enlarge ship/gates, and make polarity match/mismatch feedback unmistakable.

Previous run issue to address before peripheral polish:
browser runtime verification failed for file:///workspaces/factory-tb-123/worker-1/ystackai_studio-tb-123/checkout/games/92-acid-circuit-breaker/.factoryx-runtime-check-7.html: agent runner failed: browser runtime verification timed out
requesting targeted rework before accepting this preview

[Payload JSON, WORKFLOW.md (browser-game-2d), planning notes, and full instructions exactly as in the launching <user_query> — see .factoryx/work-orders/work-order-1781501303447-6-1/ and checkout root for the files at push time.]
```

**PR update instruction (for self):** Update PR #130 body with the above + evidence. Keep one canonical PR on the FactoryX work order branch. Use the branch guard rules (HEAD guard was dddd481 at start of this v35 verification pass; rebase/merge-forward if needed before push, never force-push stale).

**Live preview root:** games/92-acid-circuit-breaker/index.html (opens the game directly; first screen playable with no extra explanation).

**Known at push:** gh API may 401 in isolated env (use wrapped token via FACTORYX_GITHUB_TOKEN_COMMAND); git push via sanitized .factoryx/git-askpass; all evidence generated locally with real chromium on the guard HEAD. Deadline budget still open (~1.7h to 2026-06-15T14:28:32Z) — this keeps the PR live and accurate for review while polish window remains.
