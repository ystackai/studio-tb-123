# Acid Circuit Breaker — TB-123

**FactoryX Work Order:** work-order-1781501303447-6-1  
**Factory:** factory-tb-123 (TB-123)  
**Branch:** `factoryx/factory-tb-123/work-order-1781501303447-6-1`  
**PR:** #130 (this body)  
**Preview entrypoint:** `games/92-acid-circuit-breaker/index.html` (direct, self-contained, first screen playable)  
**Status:** Playable rave-bright reactive arcade; taste-gate slice first (one verb: dual-match lane+polarity "breaker" in acid circuit lanes); polished with sharp controls, scoring/combo feedback (toasts + beat-synced), restart, responsive layout (400x700 canvas + full-height touch + kb), browser verification evidence (multiple v* real chromium file:// runs), screenshots. No static poster.

## FactoryX Work Order Context
- Work Order: work-order-1781501303447-6-1
- factory_id: factory-tb-123
- project_id: tb-123
- role_id: coder-default
- runtime_profile: grok-build
- title: Acid Circuit Breaker
- Source: admin_ui
- planning_required: false
- playbook_id: browser-game-2d
- preview_entrypoint: games/92-acid-circuit-breaker/index.html
- expected_artifacts: ["github_pr"]
- completion_mode: polish_until_deadline
- deadline_utc: 2026-06-15T14:28:32Z
- experiment: seven-studio-overnight-isolated-20260615
- browser_runtime_verification: true
- review_required: true
- target_repo: ystackai/studio-tb-123
- variant: direct-build-after-checkout-scrub
- work_order_archetype: creative_game

**Full verbatim launch prompt (including previous run issue + guard + all workflow/quality rules) is committed under `.factoryx/work-orders/work-order-1781501303447-6-1/` (PREVIEW.md, VERIFICATION.md, WORKLOG.md, the original prompt context in this PR's diff history). Reviewers: see those + the guard HEAD notes for evaluation against the /goal.**

## Current Artifact (v32 evidence)
- Single-file `games/92-acid-circuit-breaker/index.html` (~32kB, zero external deps, works file:// or served, offline after load).
- Core: 3 acid circuit lanes (vertical scroller). Player ship races down traces; left/right (or side taps) change physical lane; center tap/SPACE cycles polarity (G green / P magenta / B blue). Gates descend with letter/color; to "break" (score + combo + shatter fx) must match *both* lane *and* polarity at crossing. Wrong match drops combo (floating "LANE"/"POLARITY" toast feedback). Glitches kill on contact — dodge (with 250-350ms top-of-lane "!" telegraph warnings). Gold pulses = collectible combo fuel. Beat-synced: everything pulses to internal beat; bg wash tints to current polarity; on-beat gate hits award bonus pip + brighter shatter. Pre-seeded curated slice on START so first 30s always demonstrates both verbs + mismatch + dodge + collect without RNG wait. Level/speed ramp via distance; short deliberate escalating patterns injected at LVL2+ (color-hold or lane-hold+barrage). Die → score + best combo + RETRY (re-seeds fresh taste-gate slice).
- Feel: neon TB-123 palette (#00FF41 green, #FF006E magenta, #3A86FF blue) + CRT scanlines + interference texture on glitches (raster tears, chromatic fringing) + particles + breaker arcs on shatter + shake/flash on death + floating toasts. Easing everywhere. Input <1 frame. Responsive: full-height touch strips + canvas zones + keyboard; mobile full-bleed, desktop centered.
- Audio: WebAudio gated strictly behind first user gesture (START/center/RETRY); sparse square/sine tones only (no music track per checklist).
- Verified: real chromium headless file:// runs (instrumented check-N + direct committed) for every prior "previous run issue" (check-6/7 timeouts, redeploys, 143 kills, image rollouts, zellij scrubs) + this v32. All produced clean 440x760 PNGs in <5s with post-interaction state (lane/pol change, pre-seed, toasts, warnings, shatter arcs, HUD, particles), no pageerror, no timeout. See VERIFICATION.md + screenshots/ for v32 acid-start-v32-repro.png + acid-mid-check-7-repro-v32.png (the exact check-7 repro path that previously timed out now succeeds with immediate render() exercising the fix at 299:301).

## v32 Browser Runtime Verification (addresses launch "previous run issue" for check-7)
- Guard HEAD at agent start: 73617c882f17be85fa6f5acec4feb33a1501cc95 (matches origin, up-to-date).
- PR inspected first (gh + git fallback); no blocking reviews/CHANGES_REQUESTED/failing checks.
- Reproduced *exact* failing pattern: `/tmp/acid-runtime-check-7.html` (IIFE-scope driver injected into pristine `git show` of committed index.html) + direct committed load under file:// .
- Chromium (container flags, --virtual-time-budget=9500/10000, --window-size=440,760):
  - Start (committed): 67473 bytes written → acid-start-v32-repro.png (valid 440x760 PNG, neon title + START + legend visible, no errors).
  - Mid (check-7 instrumented): 100942 bytes written → acid-mid-check-7-repro-v32.png (valid 440x760; post-interaction: left lane + blue polarity, HUD, shattered gates w/ arcs+particles at gate y, pulses, glitches+"!" warnings, LANE/POLARITY toasts, beat/pip/dot/glow, final shatter exercised).
- Exit 0 both, <3s wall, no timeout, no pageerror (dbus container noise non-fatal, consistent with all green runs).
- Confirmed `render();` immediate paint + pre-seed + time resets at ```299:301:games/92-acid-circuit-breaker/index.html``` still present (git show) and exercised (driver calls startGame + manual update/render frames + state pokes + pointer events).
- Game Feel Checklist re-PASS (see VERIFICATION.md for full assertions + exercised evidence in caps).
- This pass directly fulfills "requesting targeted rework before accepting this preview" for the check-7 timeout by running the equivalent harness in the active env and capturing evidence before any peripheral or PR-body-only work.

## Scope Implemented (per goal + taste-gate first + Game Feel)
- Playable first screen (START drops into pre-seeded circuit; act in <5s).
- Core verbs: lane traversal + polarity switch to dual-match gates ("breaker" pop via shatter + arcs), dodge glitches (with telegraph), collect pulses, beat-synced chain multipliers (phase bonus + idle decay), survive + escalating patterns (LVL2+ curated injections).
- Polish: sharp responsive controls (full-height zones + kb), scoring/combo feedback (toasts, beat flash, shatter), restart (RETRY re-seeds), responsive layout (aspect-ratio container, mobile/desktop), lightweight (32kB), self-contained.
- Avoided: no save/load, no multiple levels beyond ramp, no broad settings, no achievements, no external assets, no static poster.

## Known / Outstanding (none blocking)
- No audio music layer (intentional: checklist + "audio only after gesture"; sparse sfx sufficient for reactive feel).
- Patterns are short curated (not fully procedural) to keep first 30s reliable taste-gate while delivering "escalating" after LVL1.
- All prior verification issues (check-6/7 timeouts, redeploy resets, etc.) re-addressed with fresh evidence on their respective guard HEADs using same PR#130.

## Screenshots (v32 + history in tree)
- acid-start-v32-repro.png, acid-mid-check-7-repro-v32.png (this pass, check-7 repro)
- Prior: acid-start-v31-repro.png ... v5, acid-mid-*-repro-*.png, gameover, http variants (all archived under work-order/screenshots/ and loose check-N.html + .HEAD files).

## Verification Notes
See `.factoryx/work-orders/work-order-1781501303447-6-1/VERIFICATION.md` (full chromium commands, driver code, Game Feel, mapping to each previous-run issue including this check-7 timeout) and `PREVIEW.md` (latest evidence + how to open locally: python -m http.server or file://).

## Next / Polish Budget
- polish_until_deadline: keep same branch/PR; if time remains and no blocker, minor feel micro-tweaks only if a playtest reveals friction (no scope creep). Otherwise evidence + body updates only.
- All changes leave code in place; report PR URL.

**Live preview root opens the current artifact directly:** games/92-acid-circuit-breaker/index.html (no appended links after closed doc, no reliance on studio homepage).

FactoryX Work Order complete for budget when PR body current, evidence in tree, verification exercised the real browser runtime (post-interaction state), and first screen playable/coherent without explanation.
