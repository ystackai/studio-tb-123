# GOAL EXECUTION STRATEGY — Acid Circuit Breaker (follow-on)

Work Order: work-order-1781656674208-7-1

## Goal (verbatim from payload)
Operator feedback on approved Acid Circuit Breaker still asks for concrete changes: add a start screen/tutorial that explains mechanics, what to avoid, and how scoring/audio-reactive play works; improve the audio polish while preserving the existing game. Continue from PR https://github.com/ystackai/studio-tb-123/pull/129 and work-order-1781501303447-6-1 context. Keep the same deliverable goal, produce a reviewable PR, and include verification/preview notes.

## Context from Prior
- v41 delivered: ambitious rave-bright TB-123 polarity arcade with file-backed assets (PNG + WAV), strong horizontal cabinet, unmistakable match feedback, real reactive acid/rave music (synth layers + loop), pre-seed taste-gate, full controls, browser-verified, Game Feel PASS.
- Approved and handed off, but operator follow-on feedback requests concrete UX + audio improvements focused on onboarding clarity and polish.
- planning_required: false; playbook browser-game-2d; deliverable_node: acid-circuit-breaker-d1c7089c.

## Constraints (WORKFLOW + Game Feel + Quality Bar)
- Preserve the existing game completely: no logic, constant, spawn, scoring, visual, or control changes that alter established feel.
- Taste-gate slice already proven; do not regress the instant playable 30s experience (pre-seed remains).
- First screen must now make sense without extra explanation (tutorial content).
- Audio strictly gesture-gated; improve polish only (ramps, accents, hygiene).
- Single self-contained index.html + committed assets/.
- Real browser verification with evidence required before review handoff.
- Produce reviewable PR on canonical branch; include full prompt in PR body context section.
- No scope creep: no new levels, saves, powerups, menus beyond the requested tutorial on start.

## Implementation Approach
1. **Tutorial Start Screen (primary change)**: Expand the .screen#start-screen content with structured, skimmable sections using existing neon/CRT style. Sections:
   - Core mechanics (lane L/R + polarity flip to match BOTH for BREAK).
   - What to avoid (glitches kill; mismatch = combo reset + LANE/POLARITY callout).
   - Scoring (combo chain, beat-phase bonuses for extra BREAK juice).
   - Audio-reactive play (music builds energy with your survival + chains; toggleable acid/rave bed).
   Keep layout compact (use small font, 2-col or icon rows if fits), high-contrast, TB-123 textured. Prominent START still front-and-center. World circuit visible behind lighter overlay.
2. **Audio Polish (secondary, additive only)**:
   - Smooth energy curves (lerp or clamp rate/vol changes to avoid step artifacts).
   - On successful BREAK, emit a short "tuned signal" musical accent (tie success sonically to the track).
   - Improve start/stop: volume ramp-in on startMusic, reliable pause + currentTime reset on stop/restart, guard musicAudio instance.
   - Minor synth param or envelope tweaks if harshness observed in play (preserve character).
   - No change to toggle UX, key, or SFX layering.
3. **Verification & Evidence**: After edits, run chromium captures (start with tutorial text legible + mid after lane/pol/break + audio active). Fix any runtime blockers immediately. Update screenshots/, PREVIEW, VERIFICATION, WORKLOG.
4. **Docs & PR**: Seed/update all FACTORYX_WORK_ORDER_* files. Commit on branch. Push to factoryx/factory-tb-123/work-order-1781656674208-7-1. Refresh PR#129 (or successor) body with context including this full prompt, implemented scope, preview path, verification output.
5. **Size of steps**: Larger for the tutorial screen (product-shaped UX), small targeted diffs for audio (high uncertainty on "polish" perception).

## Success Criteria (beyond Game Feel)
- A first-time player can articulate the dual-match rule, the death condition, basic scoring incentive, and that "the music gets more intense the better you do" after reading the start screen for 10s + 20s of play.
- No regression in 60fps, payload, responsiveness, pre-seed instant fun.
- Audio feels more "polished" (no jarring jumps, success has musical payoff) but still the same track and energy arc.
- Live preview opens clean (no errors); verification passes with real browser evidence.

## What Not To Do
- Do not add settings, help button, multi-page tutorial, or delay to first playable moment.
- Do not rewrite music system or replace WAV.
- Do not touch player/gate sizes, cab, particles, pre-seed, difficulty, or any established visual feedback.
- Do not ask for review until first screen coherent, preview works, verif clean, PR body accurate.

Treat this as the final targeted iteration to address the exact remaining operator notes on an otherwise approved artifact.
