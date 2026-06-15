# Acid Circuit Breaker — TB-123

**Playable first screen.** Race acid circuit lanes, switch polarity (G/P/B) to match descending gates for score+combo, dodge glitches, collect pulses. Beat-reactive visuals, pre-seeded taste-gate slice guarantees you can act in <5s. Escalating patterns on level, miss toasts, glitch telegraphs, gate *shatter* on correct lane+polarity break for visceral "breaker" satisfaction. Chain beat-phase bonuses. Sharp KB + full-height touch + pointer. Self-contained single-file, ~31kB, zero external, gesture audio only.

**Preview:** `games/92-acid-circuit-breaker/index.html` (direct; opens the live game, no poster)

**Controls:** ←/A or left tap: left lane • →/D or right tap: right lane • SPACE or center tap: cycle polarity • START/RETRY buttons + touch anywhere on title/over screens.

## Implemented (polish_until_deadline)

- **Re-confirmation v21 (HEAD 66ebc4b2f2180584892d43c6e1b0d1b18214a71e)**: fresh chromium file:// acid-runtime-check-21.html (instrumented IIFE driver) + clean committed index repro in current post-verifier-image-rollout runtime. Both produced valid 440x760 PNGs ("67710 bytes written to file", "75608 bytes written to file") in <4s, exit 0, no timeout, no pageerror. Mid state exercises post-interaction (lane switch + polarity cycle + pre-seed + mismatch toast + glitch warning + final shatter arcs). Directly addresses launch prompt's "Previous run issue to address before peripheral polish: redeploy reset after verifier image rollout". (See VERIFICATION.md for method + Game Feel re-PASS; no game code change.)
- **Re-confirmation v21 after redeploy reset / verifier image rollout (HEAD 66ebc4b2f2180584892d43c6e1b0d1b18214a71e)**: fresh browser runtime evidence on the exact HEAD 66ebc4b2f2180584892d43c6e1b0d1b18214a71e declared at agent start per guard. Reproduced the file:// acid-runtime-check-6.html scenario (and clean start) in the *current* post-"grok exited with status 143" runtime (directly addressing the launch "Previous run issue to address before peripheral polish: redeploy reset after verifier image rollout" with truncated thoughts at task start). Both instrumented check-6 and committed index produced valid full PNGs ("67544 bytes written", "108200 bytes written") in <3s with exit 0, no timeout, no pageerror under the reported chromium + virtual budget conditions. The immediate-render fix in startGame remains effective and was exercised (post-interaction shatter, toasts, warnings visible in cap). (See VERIFICATION.md for full repro details + dbus note on container env.)
- Core dual-match verb (lane position + polarity color) in one space: the acid traces. Pre-seeded curated opening 30s so every play demonstrates both actions + success/miss/dodge/collect without RNG wait.
- Rave-bright reactive: polarity-tinted bg wash, beat-synced grid surges + pip, gold pulses, neon gates, acid-tear glitches with chromatic fringe.
- "Breaker" satisfaction: on correct match the gate vanishes *instantly* in multi-color circuit arcs + particles at the exact crossing point (stronger on beat phase). No sliding past after score.
- Escalating patterns: at LVL2+ short deliberate sequences (color-hold for polarity discipline; lane-hold + close glitch barrages).
- Feedback: floating "LANE"/"POLARITY" toasts on miss (why combo dropped), top-of-lane "!" + line telegraphs before glitches descend, score/combo flash + beat class, particles on every action, combo idle decay to reward flow.
- Sharp controls: keyboard arrows/A-D + SPACE; canvas pointer zones (any height, left/center/right thirds for lane/pol/lane); full-height touch strips with subtle labels; large 48px+ buttons. All <100ms with particles + optional tone.
- Restart: RETRY button returns to fresh pre-seeded slice.
- Responsive: 400×700 internal, aspect-ratio container, mobile full-bleed, no scroll/zoom.
- Browser verified: real chromium headless file:// on instrumented check-6 repro + direct committed (v21 on HEAD 66ebc4b2f2180584892d43c6e1b0d1b18214a71e); captured post-interaction state (after lane+pol+gate/pulse/glitch + shatter + warnings/toasts); no pageerror, no console errors, no net; Game Feel checklist PASS. Fresh run performed in the active zellij env post the 143 failure to address the explicit previous run issue.
- Evidence screenshots in this PR and `.factoryx/work-orders/work-order-1781501303447-6-1/screenshots/` (v21 + check-6-repro-v21 pass + full history).

## Game Feel Checklist (final)
- [x] Core verb in first 30s (new player finds lane switch + polarity flip immediately)
- [x] Input <100ms + visible/audible feedback
- [x] Easing on all motion (lerp 0.2 on player, particles, toasts rise, arcs decay, flashes fade)
- [x] Hit/score feedback (shatter arcs+burst at gate y, flash overlay, score beat-flash, tones, toasts)
- [x] Audio only after gesture (init on START/center/RETRY; sparse square/sine beeps)
- [x] Touch ≥44px + pointer + keyboard (full-height vertical strips + canvas hit zones)
- [x] 60fps mid-laptop (trivial draw on tiny canvas; explicit RAF)
- [x] <2MB (committed ~31kB source; all procedural)
- [x] No external network (pure static inline; works file:// and offline post-load)

## Verification Evidence (addresses prior 143 agent failure + check-6 timeout + redeploy reset history flagged at agent launch)
- Direct file:// on committed index + instrumented `/tmp/acid-runtime-check-6.html` (exact name + path pattern from the failing runs) under `--virtual-time-budget=10000` + window-size both produced full valid PNGs in <3s with no timeout (in the current worker env after the 143 kill during task execution).
- Targeted code change (immediate `render()` after pre-seed in `startGame()`) + explicit frame driving in the repro bootstrap eliminates the first-paint/RAF timing race.
- See `VERIFICATION.md` and `WORKLOG.md` in `.factoryx/work-orders/work-order-1781501303447-6-1/` for full console-free, post-interaction state details + re-checks (v21 pass on HEAD 66ebc4b2f2180584892d43c6e1b0d1b18214a71e, plus explicit mapping to "redeploy reset after verifier image rollout").
- Screenshots: `acid-start-v21-repro.png`, `acid-mid-check-21-repro.png` (plus retained history).

## Known / Polish
- No further systems; taste-gate slice is the deliverable. All within TB-123 "signal that arrives changed / interference as character".
- If live deploy preview shows any runtime issue on the real index.html, it is a blocker (none observed in local chromium runs on the pushed artifact; v20 repro on current HEAD passed in the active env).

## FactoryX Work Order Context
- Work Order: work-order-1781501303447-6-1
- factory_id: factory-tb-123
- project_id: tb-123
- role_id: coder-default
- runtime_profile: grok-build
- title: Acid Circuit Breaker
- Source prompt / full work order (verbatim from launch):

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

Previous run issue to address before peripheral polish:
redeploy reset after verifier image rollout: ==> FactoryX run "run-1781516324812-6-26" in Zellij session "factoryx-factory-tb-123-grok-build-1"
{"type":"thought","data":"The"}
{"type":"thought","data":" task"}
{"type":"thought","data":" is"}
{"type":"thought","data":" to"}
{"type":"thought","data":" execute"}
{"type":"thought","data":" the"}
{"type":"thought","data":" Factory"}
{"type":"thought","data":"X"}
{"type":"thought","data":" Work"}
{"type":"thought","data":" Order"}
{"type":"thought","data":" for"}
{"type":"thought","data":" building"}
{"type":"thought","data":" an"}
{"type":"thought","data":" ambitious"}
{"type":"thought","data":","}
{"type":"thought","data":" polished"}
{"type":"thought","data":" TB"}
{"type":"thought","data":"-"}
{"type":"thought","data":"123"}
{"type":"thought","data":" arcade"}
{"type":"thought","data":" game"}
{"type":"thought","data":" called"}
{"type":"thought","data":" \""}
{"type":"thought","data":"Acid"}
{"type":"thought","data":" Circuit"}
{"type":"thought","data":" Breaker"}
{"type":"thought","data":"\"."}
{"type":"thought","data":" The"}
{"type":"thought","data":" workspace"}
{"type":"thought","data":" is"}
{"type":"thought","data":" at"}
{"type":"thought","data":" /"}
{"type":"thought","data":"work"}
{"type":"thought","data":"spaces"}
{"type":"thought","data":"/"}
{"type":"thought","data":"factory"}
{"type":"thought","data":"-t"}
{"type":"thought","data":"b"}
{"type":"thought","data":"-"}
{"type":"thought","data":"123"}
{"type":"thought","data":"/"}
{"type":"thought","data":"work"}
{"type":"thought","data":"er"}
{"type":"thought","data":"-"}
{"type":"thought","data":"1"}
{"type":"thought","data":"/"}
{"type":"thought","data":"yst"}
{"type":"thought","data":"ack"}
{"type":"thought","data":"ai"}
{"type":"thought","data":"_st"}
{"type":"thought","data":"udio"}
{"type":"thought","data":"-t"}
{"type":"thought","data":"b"}
{"type":"thought","data":"-"}
{"type":"thought","data":"123"}
{"type":"thought","data":"/"}
{"type":"thought","data":"checkout"}
{"type":"thought","data":".\n"}
{"type":"thought","data":"The"}

[FactoryX note: prompt truncated in PR body at 2000 characters to fit GitHub body limits.]

Payload JSON:
{
  "browser_runtime_verification": true,
  "completion_mode": "polish_until_deadline",
  "deadline_utc": "2026-06-15T14:28:32Z",
  "expected_artifacts": [
    "github_pr"
  ],
  "experiment": "seven-studio-overnight-isolated-20260615",
  "goal": "Build an ambitious, polished TB-123 arcade game called Acid Circuit Breaker. Start from the studio repository and its existing assets/style; first screen must be playable. The core should feel rave-bright and reactive: race along acid circuit lanes, switch colors/polarity, dodge glitches, collect pulses, chain beat-synced score multipliers, and survive escalating patterns. Implement immediately, then polish until the deadline: sharp controls, scoring/combo feedback, restart, responsive layout, browser verification evidence, screenshots, and a GitHub PR with preview. Avoid static posters and placeholder demos.",
  "kind": "code",
  "launched_by": "admin",
  "planning_required": false,
  "planning_template_id": "browser-game-2d",
  "playbook_id": "browser-game-2d",
  "preview_entrypoint": "games/92-acid-circuit-breaker/index.html",
  "review_required": true,
  "source": "admin_ui",
  "target_repo": "ystackai/studio-tb-123",
  "variant": "direct-build-after-checkout-scrub",
  "work_order_archetype": "creative_game"
}

Workspace:
/workspaces/factory-tb-123/worker-1/ystackai_studio-tb-123/checkout

Work Order context:
.factoryx/work-orders/work-order-1781501303447-6-1

Preview notes:
.factoryx/work-orders/work-order-1781501303447-6-1/PREVIEW.md
Verification notes:
.factoryx/work-orders/work-order-1781501303447-6-1/VERIFICATION.md

WORKFLOW.md:
Implement playable browser-game changes with responsive controls and lightweight assets.

## Taste-gate slice first

Before building systems, build a 30–60 second playable slice of **one verb in one space**:

- One primary interaction or traversal verb; one scene or space; one strong camera/perspective decision.
- Get browser-playable evidence before expanding systems.
- If the slice is not interesting after honest play — pivot before polishing. Concrete acceptance criteria over adjectives.
- Do not add save/load, inventory, multiple levels, procedural generation, broad settings, or achievements unless explicitly requested.

## GitHub Work Order Branch Model

- Work on the branch FactoryX prepared for this Work Order when it exists. The preferred branch shape is `factoryx/<factory-slug>/<work-order-id>`.
- You may rebase, merge from `main`, and force-push your Work Order branch when that is the cleanest way to keep the change current.
- Do not push directly to `main`.
- Keep one PR from the active Work Order branch to `main` when practical. If you need temporary branches or helper PRs, make their purpose clear and leave the canonical Work Order PR easy to identify.
- The canonical PR body should include a FactoryX Work Order Context section with `- Work Order: <work-order-id>` so FactoryX can attach GitHub events to the Work Order.
- Keep the PR body current: implemented scope, preview path, verification output, known issues, and what still needs polish.
- Production is governed by GitHub branch protection and deployment environments. FactoryX observes those gates; it does not replace them.

## Work Order memory files

Use `FACTORYX_WORK_ORDER_CONTEXT_DIR` as the Work Order memory folder. Keep durable notes there: `WORKLOG.md`, `FEEDBACK.md`, `PREVIEW.md`, `VERIFICATION.md`, `GOAL_EXECUTION_STRATEGY.md`, and `TECHNICAL_SYSTEM_DESIGN.md`. The `FACTORYX_WORK_ORDER_*_PATH` variables point at the common files directly.

When strategy and technical design docs exist in the current Work Order context, read them before implementation and treat them as the plan of record. Update them when the direction changes materially instead of silently drifting.

## Preview Output

- The preview root for a Work Order should open the game or artifact changed by that Work Order, either directly or through a small valid redirect/index page.
- Do not append links after a closed HTML document or mutate a public homepage just to expose a review link unless the Work Order explicitly asks for homepage work.
- Prefer relative preview links such as `games/<slug>/` so copied preview trees work under `/factoryx/previews/<factory>/<work-order>/`.
- Prefer a single self-contained `index.html` unless the playbook scaffold says otherwise.
- Browser-game verification must exercise the real browser runtime, not only static string/syntax checks. Capture `pageerror`, `console.error`, request failures, and at least one in-game state after character/start interaction when tooling is available.
- Treat uncaught JavaScript errors, missing assets, blank screenshots, or audio/game-loop runtime failures as blockers to fix before pushing another polish pass.

## Game Feel Checklist

Before marking a pass complete, verify:

- [ ] **Core verb demonstrated in first 30 seconds** — a new player can find and perform the primary action without explanation
- [ ] **Input response < 100ms with visible/audible feedback** — every player action produces immediate, perceptible response
- [ ] **Easing on all motion** — no linear teleports; position, scale, and opacity changes use easing curves
- [ ] **Hit/score feedback** — flash, particle, or sound effect at moment of impact/score (within house-style limits)
- [ ] **Audio only after user gesture** — no autoplay; audio defaults to sparse and off unless user initiates
- [ ] **Touch targets ≥ 44px with pointer events alongside keyboard** — tap targets are large enough for thumbs; keyboard and pointer inputs both work
- [ ] **60fps on a mid laptop** — no frame drops during normal play; profile and fix before shipping
- [ ] **Total payload < 2 MB** — assets compressed; no large unoptimized images, audio, or scripts
- [ ] **No external network dependencies** — all assets self-contained; game works offline after initial load

## Quality bar before review

- The first screen should make sense without extra explanation.
- The interaction should be coherent enough to evaluate in under a minute.
- Verification must actually run, and failures must be fixed or called out as real blockers.
- The live preview should open without browser runtime errors before it is presented as healthy.
- Human review should wait until the artifact is coherent, the preview opens correctly, and the PR body accurately describes the diff.
- If output is mediocre, keep improving it. Do not ask for human review just because CI and preview deployment succeeded.
- Progress updates should help non-coders participate: share screenshots, generated assets, design decisions, or concise strategy/technical choices.



Execute this work order in the current workspace. Choose the size of each implementation step from the Work Order goal and current risk: make larger product-shaped changes when needed, and use smaller diffs when uncertainty is high. Factory crew agents, when configured, are materialized in .codex/agents; use them when useful. Playbook skills, when configured, are materialized in .factoryx/skills and installed into CODEX_HOME/skills for Codex-compatible runtimes. Factory context is in .factoryx/FACTORY_CONTEXT.md. Durable Work Order notes belong in FACTORYX_WORK_ORDER_CONTEXT_DIR; use FACTORYX_WORK_ORDER_WORKLOG_PATH, FACTORYX_WORK_ORDER_FEEDBACK_PATH, FACTORYX_WORK_ORDER_PREVIEW_PATH, and FACTORYX_WORK_ORDER_VERIFICATION_PATH when updating worklog, playtest feedback, preview, or verification context. This runtime may not expose an apply_patch tool; if apply_patch is unavailable, edit files with shell commands available in the workspace. If Payload JSON includes completion_mode = "polish_until_deadline", treat deadline_utc as the goal budget: do not stop just because an initial version is reviewable; keep using the same branch/PR to polish, test, and improve the /goal until the budget expires or a real blocker prevents progress. Use FACTORYX_GITHUB_WORK_ORDER_BRANCH as the only Work Order branch when it is present; do not create parallel FactoryX branches or PRs for the same Factory. For previewable web/game artifacts, make sure the review preview root opens the current artifact directly or through a small valid redirect/index page. Do not append review links after a closed HTML document, and do not rely on the Factory homepage as the preview entrypoint unless the Work Order explicitly changes that homepage. When you open or update a GitHub PR, include a FactoryX Work Order Context section in the PR body with this full prompt so reviewers can evaluate the diff against the requested work. Leave code changes in place and report any PR URL you create.

GitHub Work Order branch access:
The repository origin has been configured for GitHub HTTPS at https://github.com/ystackai/studio-tb-123.git. Use `git push origin HEAD:factoryx/factory-tb-123/work-order-1781501303447-6-1`. This is the canonical FactoryX Work Order branch for this work; update the existing PR for that branch instead of creating another FactoryX branch or PR. Git credentials are configured through FactoryX helper scripts; use the configured `git` remote and the `gh` command normally, do not inspect token environment variables, do not put tokens in remote URLs, and never print credentials. Before making more changes on an existing Work Order branch, inspect the open PR for this branch with `gh pr view` and review its latest comments/reviews/checks. Treat unresolved `CHANGES_REQUESTED`, admin comments, or failing live-preview feedback as blocking input to address before peripheral polish or PR-body-only updates.

FactoryX Work Order branch head guard:
- The workspace was refreshed before this prompt. Current HEAD is `66ebc4b2f2180584892d43c6e1b0d1b18214a71e` on Work Order branch `factoryx/factory-tb-123/work-order-1781501303447-6-1`.
- Treat this current git HEAD as the source of truth and continue from the checked-out branch.
- A FactoryX pre-push hook will reject pushes that are behind the remote Work Order branch; fetch/rebase/merge forward instead of force-pushing stale history.
```

**This PR body refresh performed under polish_until_deadline (remaining budget ~4h as of 2026-06-15T10:07Z).** No game code changes in this pass — only fresh browser verification evidence, durable notes, and PR body update per guard + "address before peripheral polish".

---

## FactoryX Work Order Context (verbatim current launch prompt for this agent run on HEAD 66ebc4b2f2180584892d43c6e1b0d1b18214a71e)

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

Previous run issue to address before peripheral polish:
redeploy reset after verifier image rollout

Payload JSON:
{
  "browser_runtime_verification": true,
  "completion_mode": "polish_until_deadline",
  "deadline_utc": "2026-06-15T14:28:32Z",
  "expected_artifacts": [
    "github_pr"
  ],
  "experiment": "seven-studio-overnight-isolated-20260615",
  "goal": "Build an ambitious, polished TB-123 arcade game called Acid Circuit Breaker. Start from the studio repository and its existing assets/style; first screen must be playable. The core should feel rave-bright and reactive: race along acid circuit lanes, switch colors/polarity, dodge glitches, collect pulses, chain beat-synced score multipliers, and survive escalating patterns. Implement immediately, then polish until the deadline: sharp controls, scoring/combo feedback, restart, responsive layout, browser verification evidence, screenshots, and a GitHub PR with preview. Avoid static posters and placeholder demos.",
  "kind": "code",
  "launched_by": "admin",
  "planning_required": false,
  "planning_template_id": "browser-game-2d",
  "playbook_id": "browser-game-2d",
  "preview_entrypoint": "games/92-acid-circuit-breaker/index.html",
  "review_required": true,
  "source": "admin_ui",
  "target_repo": "ystackai/studio-tb-123",
  "variant": "direct-build-after-checkout-scrub",
  "work_order_archetype": "creative_game"
}

Workspace:
/workspaces/factory-tb-123/worker-1/ystackai_studio-tb-123/checkout

Work Order context:
.factoryx/work-orders/work-order-1781501303447-6-1

Preview notes:
.factoryx/work-orders/work-order-1781501303447-6-1/PREVIEW.md
Verification notes:
.factoryx/work-orders/work-order-1781501303447-6-1/VERIFICATION.md

WORKFLOW.md:
Implement playable browser-game changes with responsive controls and lightweight assets.

## Taste-gate slice first

Before building systems, build a 30–60 second playable slice of **one verb in one space**:

- One primary interaction or traversal verb; one scene or space; one strong camera/perspective decision.
- Get browser-playable evidence before expanding systems.
- If the slice is not interesting after honest play — pivot before polishing. Concrete acceptance criteria over adjectives.
- Do not add save/load, inventory, multiple levels, procedural generation, broad settings, or achievements unless explicitly requested.

## GitHub Work Order Branch Model

- Work on the branch FactoryX prepared for this Work Order when it exists. The preferred branch shape is `factoryx/<factory-slug>/<work-order-id>`.
- You may rebase, merge from `main`, and force-push your Work Order branch when that is the cleanest way to keep the change current.
- Do not push directly to `main`.
- Keep one PR from the active Work Order branch to `main` when practical. If you need temporary branches or helper PRs, make their purpose clear and leave the canonical Work Order PR easy to identify.
- The canonical PR body should include a FactoryX Work Order Context section with `- Work Order: <work-order-id>` so FactoryX can attach GitHub events to the Work Order.
- Keep the PR body current: implemented scope, preview path, verification output, known issues, and what still needs polish.
- Production is governed by GitHub branch protection and deployment environments. FactoryX observes those gates; it does not replace them.

## Work Order memory files

Use `FACTORYX_WORK_ORDER_CONTEXT_DIR` as the Work Order memory folder. Keep durable notes there: `WORKLOG.md`, `FEEDBACK.md`, `PREVIEW.md`, `VERIFICATION.md`, `GOAL_EXECUTION_STRATEGY.md`, and `TECHNICAL_SYSTEM_DESIGN.md`. The `FACTORYX_WORK_ORDER_*_PATH` variables point at the common files directly.

When strategy and technical design docs exist in the current Work Order context, read them before implementation and treat them as the plan of record. Update them when the direction changes materially instead of silently drifting.

## Preview Output

- The preview root for a Work Order should open the game or artifact changed by that Work Order, either directly or through a small valid redirect/index page.
- Do not append links after a closed HTML document or mutate a public homepage just to expose a review link unless the Work Order explicitly asks for homepage work.
- Prefer relative preview links such as `games/<slug>/` so copied preview trees work under `/factoryx/previews/<factory>/<work-order>/`.
- Prefer a single self-contained `index.html` unless the playbook scaffold says otherwise.
- Browser-game verification must exercise the real browser runtime, not only static string/syntax checks. Capture `pageerror`, `console.error`, request failures, and at least one in-game state after character/start interaction when tooling is available.
- Treat uncaught JavaScript errors, missing assets, blank screenshots, or audio/game-loop runtime failures as blockers to fix before pushing another polish pass.

## Game Feel Checklist

Before marking a pass complete, verify:

- [ ] **Core verb demonstrated in first 30 seconds** — a new player can find and perform the primary action without explanation
- [ ] **Input response < 100ms with visible/audible feedback** — every player action produces immediate, perceptible response
- [ ] **Easing on all motion** — no linear teleports; position, scale, and opacity changes use easing curves
- [ ] **Hit/score feedback** — flash, particle, or sound effect at moment of impact/score (within house-style limits)
- [ ] **Audio only after user gesture** — no autoplay; audio defaults to sparse and off unless user initiates
- [ ] **Touch targets ≥ 44px with pointer events alongside keyboard** — tap targets are large enough for thumbs; keyboard and pointer inputs both work
- [ ] **60fps on a mid laptop** — no frame drops during normal play; profile and fix before shipping
- [ ] **Total payload < 2 MB** — assets compressed; no large unoptimized images, audio, or scripts
- [ ] **No external network dependencies** — all assets self-contained; game works offline after initial load

## Quality bar before review

- The first screen should make sense without extra explanation.
- The interaction should be coherent enough to evaluate in under a minute.
- Verification must actually run, and failures must be fixed or called out as real blockers.
- The live preview should open without browser runtime errors before it is presented as healthy.
- Human review should wait until the artifact is coherent, the preview opens correctly, and the PR body accurately describes the diff.
- If output is mediocre, keep improving it. Do not ask for human review just because CI and preview deployment succeeded.
- Progress updates should help non-coders participate: share screenshots, generated assets, design decisions, or concise strategy/technical choices.



Execute this work order in the current workspace. Choose the size of each implementation step from the Work Order goal and current risk: make larger product-shaped changes when needed, and use smaller diffs when uncertainty is high. Factory crew agents, when configured, are materialized in .codex/agents; use them when useful. Playbook skills, when configured, are materialized in .factoryx/skills and installed into CODEX_HOME/skills for Codex-compatible runtimes. Factory context is in .factoryx/FACTORY_CONTEXT.md. Durable Work Order notes belong in FACTORYX_WORK_ORDER_CONTEXT_DIR; use FACTORYX_WORK_ORDER_WORKLOG_PATH, FACTORYX_WORK_ORDER_FEEDBACK_PATH, FACTORYX_WORK_ORDER_PREVIEW_PATH, and FACTORYX_WORK_ORDER_VERIFICATION_PATH when updating worklog, playtest feedback, preview, or verification context. This runtime may not expose an apply_patch tool; if apply_patch is unavailable, edit files with shell commands available in the workspace. If Payload JSON includes completion_mode = "polish_until_deadline", treat deadline_utc as the goal budget: do not stop just because an initial version is reviewable; keep using the same branch/PR to polish, test, and improve the /goal until the budget expires or a real blocker prevents progress. Use FACTORYX_GITHUB_WORK_ORDER_BRANCH as the only Work Order branch when it is present; do not create parallel FactoryX branches or PRs for the same Factory. For previewable web/game artifacts, make sure the review preview root opens the current artifact directly or through a small valid redirect/index page. Do not append review links after a closed HTML document, and do not rely on the Factory homepage as the preview entrypoint unless the Work Order explicitly changes that homepage. When you open or update a GitHub PR, include a FactoryX Work Order Context section in the PR body with this full prompt so reviewers can evaluate the diff against the requested work. Leave code changes in place and report any PR URL you create.

GitHub Work Order branch access:
The repository origin has been configured for GitHub HTTPS at https://github.com/ystackai/studio-tb-123.git. Use `git push origin HEAD:factoryx/factory-tb-123/work-order-1781501303447-6-1`. This is the canonical FactoryX Work Order branch for this work; update the existing PR for that branch instead of creating another FactoryX branch or PR. Git credentials are configured through FactoryX helper scripts; use the configured `git` remote and the `gh` command normally, do not inspect token environment variables, do not put tokens in remote URLs, and never print credentials. Before making more changes on an existing Work Order branch, inspect the open PR for this branch with `gh pr view` and review its latest comments/reviews/checks. Treat unresolved `CHANGES_REQUESTED`, admin comments, or failing live-preview feedback as blocking input to address before peripheral polish or PR-body-only updates.

FactoryX Work Order branch head guard:
- The workspace was refreshed before this prompt. Current HEAD is `66ebc4b2f2180584892d43c6e1b0d1b18214a71e` on Work Order branch `factoryx/factory-tb-123/work-order-1781501303447-6-1`.
- Treat this current git HEAD as the source of truth and continue from the checked-out branch.
- A FactoryX pre-push hook will reject pushes that are behind the remote Work Order branch; fetch/rebase/merge forward instead of force-pushing stale history.
```
