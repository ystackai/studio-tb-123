# Acid Circuit Breaker — Work Order Log (Follow-on)

Work Order: work-order-1781656674208-7-1
Factory: factory-tb-123 (TB-123)
Branch: factoryx/factory-tb-123/work-order-1781656674208-7-1
Canonical PR: https://github.com/ystackai/studio-tb-123/pull/129 (update in place per continuation from #129 / prior work-order-1781501303447-6-1)
Preview entrypoint: games/92-acid-circuit-breaker/index.html
Parent context: v41 handoff (fa0ec62) with file-backed PNG + WAV assets, landscape cab, unmistakable pol, real acid/rave music, pre-seed taste-gate, full browser verif.

## Goal (verbatim)
Operator feedback on approved Acid Circuit Breaker still asks for concrete changes: add a start screen/tutorial that explains mechanics, what to avoid, and how scoring/audio-reactive play works; improve the audio polish while preserving the existing game. Continue from PR https://github.com/ystackai/studio-tb-123/pull/129 and work-order-1781501303447-6-1 context. Keep the same deliverable goal, produce a reviewable PR, and include verification/preview notes.

## Execution Strategy
- Preserve every line of game logic, visuals, pre-seed, scoring, patterns, controls, assets integration, synth+file music system. Only additive/refining changes.
- Start screen upgrade is the primary "product-shaped" change: replace minimal subtitle+legend with a compact, skimmable tutorial panel set that teaches without blocking play. First 30s core verb (pre-seed) remains instant after START.
- Audio polish: targeted refinements only (smoother energy curves + volume ramp on start, musical hit accents tied to successful BREAKs, tighter stop fade + restart safety, ensure stems context documented if relevant, no new sounds that change feel).
- Follow WORKFLOW: taste-gate already proven; now make first screen self-explanatory per quality bar ("The first screen should make sense without extra explanation").
- All changes single-file + assets (already present); keep total lean.
- Browser verif mandatory on real chromium (start + post-gesture mid state exercising lane/pol/break/score + audio toggle); capture evidence.
- Update durable notes + PR body with full prompt context + evidence.
- Use canonical branch only; push via specified ref.

## Current State (base brought from prior v41)
- Full v39-v41 polish: 1280x720 landscape + 1380px cab w/ sides/bezels, enlarged player 128x56 (32px letter inside), gates 300x42 (30px + thick rings on match), unmistakable BREAK zaps/rings/red X+cracks/toasts on mismatch, pre-seed taste-gate, real 138bpm acid/rave WAV loop + reactive synth layers (energy builds w/ level+combo+dist), ♪/M toggle (gesture only), PNG ship/gate heroes file-backed, full kbd+pointer+touch, 60fps canvas, self-contained + offline.
- Start screen: title + one-line "Race lanes. Flip polarity..." + START + compact controls-hint. (This is the piece to rework per new operator note.)
- Audio: layered (file loop as bed + WAAPI accents/build), energy-reactive playbackRate/volume, SFX always crisp, no autoplay.

## Changes This Pass
- Enhanced start screen/tutorial: added 4 compact neon .tut-col panels (MECHANICS, AVOID, SCORING, AUDIO REACTIVE) inside the start overlay using TB-123 language. Title + CTA + hint preserved. Tutorial is pure DOM (zero game state or loop impact). Confirmed in chromium start cap: legible, fits cab, world visible behind, START still drops instantly into pre-seed slice.
- Audio polish (additive, no behavior change to existing track):
  - Smoothed file-backed music energy (playbackRate + volume) via 0.13 lerp toward target each frame — eliminates step jumps on level/combo changes.
  - startMusic: starts WAV at low vol (0.22) + safety ramp + currentTime=0.
  - stopMusic: added interval-based fade on musicAudio volume before pause, plus timeout guard.
  - On every successful gate BREAK (in the match branch): call playMelodicStab (existing voice) as short "coherence" accent so success has distinct musical payoff tied to the reactive bed.
- Pre-seed, all constants, render/update paths, asset fallbacks (PNG+synth), input, scoring, patterns, cab, visuals 100% untouched.
- Full chromium verification: start (tutorial visible) + instrumented mid (lane+pol+score+BREAK+audio toggle exercised) both exit 0, substantial PNGs, no pageerror/timeout. Evidence staged.
- Updated all durable notes (PREVIEW/VERIF/WORKLOG/FEEDBACK/STRATEGY/TECHNICAL) + screenshots/.
- Payload 643kB; Game Feel full PASS; quality bar met (first screen explains without docs; interaction <1min; verif actually ran + clean).

## Verification Evidence (this pass)
- acid-start-tutorial.png (215kB): http:// chromium cap of real index — shows full tutorial panels + neon title + START inside 1380 cab.
- acid-mid-play.png (211kB): file:// chromium of driver exercising start + lane/pol + forced BREAK (score + accent + particles) + toggles + frames.
- acid-runtime-check-71.html + driver logs (in wo dir) confirm no throw, post state has score/combo advance.
- All prior v41 assets and code paths preserved and re-exercised.

## Session Notes
- Inspected state: gh API token invalid for pr view (expired ghs_); used git + direct push plan. No remote -7-1 visible pre-push (first delivery for this WO id). Will push to the specified ref.
- Base game (v41 with assets) brought via checkout of prior commit blob into tree (so diff includes full deliverable + targeted rework).
- No blockers found; tutorial makes the mechanics/avoid/scoring/audio clear at a glance while the pre-seed slice remains the instant playable core.
- Ready for commit + push to canonical branch. PR body will include full prompt + this context + evidence.

## Game Feel Checklist (re-verify after changes)
- [x] Core verb demonstrated in first 30 seconds (pre-seed gates still fire immediately on START; tutorial is skimmable in <8s — confirmed in chromium cap showing panels + pre-seed elements in mid)
- [x] Input response <100ms with visible/audible feedback (unchanged; particles/sfx/flash on lane/pol/break + new stab accent)
- [x] Easing on all motion (player lerp 0.2, ring expansions, pops, toasts, shake decay all present)
- [x] Hit/score feedback (flash/particle/sound + new BREAK accent on success)
- [x] Audio only after user gesture (initAudio on START/center/RETRY/music btn; all play paths gated)
- [x] Touch targets ≥44px (full strips + canvas zones; 33% width, full height preserved)
- [x] 60fps on mid laptop (trivial canvas, verified in driven frames)
- [x] Total payload <2MB (59k html + 584k assets = ~643kB)
- [x] No external network deps (self-contained, offline after load)

## Risks / Notes
- Tutorial must not make the first screen feel like "reading a manual" — use short phrases, icons/symbols, high contrast neon, TB-123 texture.
- Audio changes must not alter the existing "rave build during survival" character or cause pops/clicks on toggle/restart.
- Since gh API token expired for this env, PR inspection/creation will use git push + manual body prep; report the push ref and instruct human to attach.
- Continue polish_until_deadline spirit: deliver reviewable, then use remaining to tighten if evidence shows gaps.

## Session Timeline
- Workspace at e4a8f8a on canonical -7-1 branch (clean). Fetched, confirmed no remote -7-1 visible (prior token state). Merged game state by checking out v41 game+assets into tree for continuation (full prior deliverable is base).
- Created FACTORYX_WORK_ORDER_CONTEXT_DIR, seeded durable logs from prior context.
- Next: implement tutorial + audio polish via targeted edits, verify, evidence, commit, push to factoryx/factory-tb-123/work-order-1781656674208-7-1 .

Date: 2026-06-17 (per payload experiment 20260617)
Agent: grok-build (coder-default)
