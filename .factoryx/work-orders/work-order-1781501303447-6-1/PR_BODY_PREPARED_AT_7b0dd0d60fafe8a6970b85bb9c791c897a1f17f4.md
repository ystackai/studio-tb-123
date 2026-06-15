# Acid Circuit Breaker (TB-123)

**Work Order:** work-order-1781501303447-6-1  
**Factory:** factory-tb-123 (TB-123)  
**Preview entrypoint:** `games/92-acid-circuit-breaker/index.html` (self-contained, first screen playable)  
**Branch/PR:** `factoryx/factory-tb-123/work-order-1781501303447-6-1` → PR #130  
**Status:** OPEN, all delivery checks green (facts/ci/deploy-preview SUCCESS). No blocking reviews.

## Implemented Scope (taste-gate slice + polish passes)
- One verb (dual lane + polarity match to "break" gates for score/combo), one space (acid circuit traces).
- Rave-bright reactive core: beat-synced bg tint + grid surges + gold pulses + polarity ship glow + lane pips.
- Sharp controls: keyboard (arrows/A-D + SPACE), full-height pointer/touch strips (any Y on left/center/right thirds), canvas-level pointerdown zones.
- Pre-seeded curated taste-gate on START/RETRY so first 30s always demonstrates lane switch, polarity cycle, easy match, mismatch (toast), dodge, collect — no RNG wait.
- Scoring: base + beat-phase bonus (near visual peak → +1 combo pip + 1.5x pts + brighter fx) + gold pulse collects. Idle combo decay encourages flow.
- "Breaker" satisfaction: correct dual-match gate *shatters* instantly with circuit arcs + colored particles at the exact gate y (stronger on beat). No slide-past.
- Escalating patterns (LVL≥2+): deliberate color-hold or lane-hold sequences + close threats injected on level-up thresholds.
- Feedback: floating "LANE"/"POLARITY" toasts on miss (red, rise+fade), "!" + gold line telegraph warnings at top of glitch lanes before they arrive, particles/flash/score pop/sfx on every action, CRT scanlines + neon.
- Survival: glitches kill on contact; speed ramps with distance + level; restart always fresh pre-seed.
- Responsive: 400×700 canvas in aspect-ratio container, mobile full-bleed, touch targets effective full height.
- Audio: WebAudio tones only after explicit user gesture (START/center/RETRY); sparse, no autoplay.
- Zero external deps, <30kB total, offline after load, 60fps trivial.

All Game Feel checklist items PASS (see VERIFICATION.md).

## Browser Runtime Verification Evidence (v29 — addresses "redeploy reset after verifier image rollout")
- Real `/usr/bin/chromium` (149) headless=new, container flags, --virtual-time-budget, file:// (reproducing the exact prior timeout harness conditions).
- Guard HEAD at agent start: 7b0dd0d60fafe8a6970b85bb9c791c897a1f17f4 (matches remote, PR head).
- Clean start (committed index.html): 67469B valid 440×760 PNG `acid-start-v29-repro.png` — neon title "ACID CIRCUIT BREAKER", pulsing, START button, control legend, CRT overlay, no layout issues.
- Instrumented mid (acid-runtime-check-29.html IIFE-scope driver from `git show` pristine base): 92969B valid 440×760 PNG `acid-mid-check-29-repro.png` — post lane-- + cyclePolarity + pre-seed + driven frames: left+blue player, HUD (score/LVL/combo), shattered pre-seed gates with arcs/particles at gate y, gold pulses, acid-tear glitches + top "!" warnings, "LANE"/"POLARITY" toasts, beat pip + polarity dot + lane glow, particles. Exercises full core + new feedback paths.
- Both: exit 0, <3s wall time, **no timeout, no pageerror**. Dbus noise ignored (non-fatal, consistent history).
- Archived: screenshots/acid-start-v29-repro.png, acid-mid-check-29-repro.png, acid-runtime-check-29.html, acid-check-29.HEAD (guard sha) + loose copies at work-order root.
- The immediate `render();` + time resets after pre-seed in startGame (lines 299:301) remain present and are what makes first-screen + in-game state synchronously available to any harness (confirmed via `git show` + successful repro).
- No game code modified this pass (per "only modify code required by the task").

See `.factoryx/work-orders/work-order-1781501303447-6-1/VERIFICATION.md` (full method + prior v2..v28 runs), `PREVIEW.md`, `WORKLOG.md`, `GOAL_EXECUTION_STRATEGY.md`, and `screenshots/`.

## Game Feel Checklist (re-PASS at v29)
- [x] Core verb demonstrated in first 30s (pre-seed guarantees lane+pol verbs + mismatch + dodge + collect without explanation)
- [x] Input response <100ms + visible/audible feedback (particles, flash, toast, arc, sfx, HUD pop, beat pip on every action)
- [x] Easing on all motion (0.2 lerp player.x, life-based decay on arcs/particles/toasts/warnings, no linear teleports)
- [x] Hit/score feedback (gate shatter arcs+burst at exact match point, beat-phase extra white, score beat-flash class, flash overlay, particles)
- [x] Audio only after user gesture (initAudio on START/center/RETRY; tones gated)
- [x] Touch targets ≥44px effective (full-height 33% vertical strips + canvas pointer zones; bottom labels are hints only)
- [x] 60fps on mid laptop (trivial 400x700 2d canvas, <2MB)
- [x] Total payload <2MB (self-contained ~25-35kB html)
- [x] No external network (all inline/procedural)

## FactoryX Work Order Context
Work Order id: work-order-1781501303447-6-1
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
- The workspace was refreshed before this prompt. Current HEAD is `7b0dd0d60fafe8a6970b85bb9c791c897a1f17f4` on Work Order branch `factoryx/factory-tb-123/work-order-1781501303447-6-1`.
- Treat this current git HEAD as the source of truth and continue from the checked-out branch.
- A FactoryX pre-push hook will reject pushes that are behind the remote Work Order branch; fetch/rebase/merge forward instead of force-pushing stale history.

(End of verbatim launch prompt / payload for this Work Order. All durable logs, strategy, verification evidence, and screenshots live under .factoryx/work-orders/work-order-1781501303447-6-1/ . The single canonical PR is #130.)
