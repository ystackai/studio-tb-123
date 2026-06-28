# GOAL EXECUTION STRATEGY — Acid Circuit Breaker (operator followup)

Work Order: work-order-1781694911130-followup

## Goal (verbatim from payload)
Operator feedback requires a follow-on pass for "Acid Circuit Breaker".

Reason queued: approve note requests changes.
Feedback id: review:tb-123:operator-review-tb-pr132-1781657258365
Feedback source/action: human_review/approve
Parent Work Order: work-order-1781656674208-7-1
Game entrypoint: games/92-acid-circuit-breaker/index.html

Feedback:
Operator repair: Grok exited 0 and committed Acid Circuit Breaker tutorial/audio follow-on 9791a49; PR https://github.com/ystackai/studio-tb-123/pull/132 is published. Original failed state was missing expected browser-runtime-post.png artifact despite run-generated Chromium screenshots/verification evidence.

Use the feedback as the primary acceptance criteria for this follow-up.

Implement the requested changes as a reviewable code follow-up attached to the same deliverable. Address this feedback before unrelated polish. Keep useful existing work, but materially redesign the interaction, explanation, visual assets, or audio when the feedback calls for it.

Real file-backed generated/authored assets under assets/generated, games/**/assets, or drops/**/assets plus manifest/provenance are required when asset/music changes are material; ASSET_MANIFEST.md alone and in-code-only procedural systems do not satisfy generated_assets.
Run browser/runtime verification, include screenshot or evidence notes, update the preview entrypoint if needed, and create or update a GitHub PR.

Original parent goal/context:
Operator feedback on approved Acid Circuit Breaker still asks for concrete changes: add a start screen/tutorial that explains mechanics, what to avoid, and how scoring/audio-reactive play works; improve the audio polish while preserving the existing game. Continue from PR https://github.com/ystackai/studio-tb-123/pull/129 and work-order-1781501303447-6-1 context. Keep the same deliverable goal, produce a reviewable PR, and include verification/preview notes.

## Context from Prior
- Parent WO work-order-1781656674208-7-1 delivered the tutorial start screen (4 panels) + audio polish (lerp, ramps, BREAK stab accent) on top of v41 file-backed assets + cab.
- PR #132 published.
- But verification produced acid-*.png screenshots; the expected browser-runtime-post.png was missing per factory operator note.
- This followup addresses exactly that: ensure the named artifact is produced by running chromium verification that outputs browser-runtime-post.png (and companion), update all notes, re-verify the deliverable.

## Constraints (WORKFLOW + Game Feel + Quality Bar)
- Primary: produce the missing browser-runtime-post.png via real chromium run + evidence in wo context.
- Keep useful existing work: tutorial, audio polish, assets, pre-seed, full prior systems untouched unless feedback requires material redesign.
- No scope creep: address the verification artifact gap first.
- Real browser runtime verification (not just static); capture pageerror/console + post-interaction state.
- Use canonical branch factoryx/factory-tb-123/work-order-1781694911130-followup ; push specified ref.
- Include full prompt in PR body; update existing PR#132.
- Game Feel + quality bar already met by parent; re-confirm on this pass.
- File-backed assets already present under games/92-acid-circuit-breaker/assets/ ; add manifest/provenance here for contract.

## Implementation Approach
1. Bring forward the game + assets + parent wo context into this branch working tree.
2. Run fresh chromium verification using file:// on index (start) and instrumented driver (post), explicitly writing browser-runtime-post.png + browser-runtime-start.png .
3. Create/update durable notes (WORKLOG, PREVIEW, VERIFICATION, FEEDBACK, STRATEGY, TECHNICAL) for this WO id, referencing the artifact gap + evidence.
4. Create ASSET_MANIFEST.md documenting the file-backed PNG/WAV provenance (generated via canvas export + wave synth per prior).
5. Stage screenshots/ with the exact named artifacts.
6. Commit + push to the WO branch ref.
7. Refresh PR body (via gh or note) with full context + verification output + "Work Order: work-order-1781694911130-followup".
8. If verification surfaces any runtime issue (missing post state, errors), fix before handoff.

## Success Criteria
- browser-runtime-post.png (and start) exist in wo screenshots/ with valid PNG bytes from chromium run on the preview entrypoint exercising interaction.
- VERIFICATION.md updated with exact run output, no pageerror, post state confirms lane/pol/BREAK/score.
- PR updated, preview entrypoint unchanged (games/92-acid-circuit-breaker/index.html).
- No regression to game; first screen explains per prior; Game Feel PASS.
- Full payload context in notes + PR.

## What Not To Do
- Do not rewrite game systems or tutorial before verifying the artifact issue.
- Do not push unrelated polish.
- Do not rely on previous acid-*.png names; use the expected browser-runtime-post.png .
