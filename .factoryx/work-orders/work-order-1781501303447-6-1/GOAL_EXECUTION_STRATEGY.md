# Goal Execution Strategy: Acid Circuit Breaker (TB-123 Arcade)

Work Order: `work-order-1781501303447-6-1`  
Title: Acid Circuit Breaker  
Canonical branch: `factoryx/factory-tb-123/work-order` (reuse, update PR #129 in place)  
Target repo: `ystackai/studio-tb-123`  
Archetype: `creative_game` / browser-game-2d  
Completion: `polish_until_deadline` until 2026-06-15T17:32:54Z  
Planning: not required (planning_required=false in payload)

## FactoryX Work Order Context

Durable notes live under `.factoryx/work-orders/work-order-1781501303447-6-1/`.  
Key files: WORKLOG.md, FEEDBACK.md (full playtest + asset log), PREVIEW.md, VERIFICATION.md, ASSET_MANIFEST.md (critical for 17:25 blocker), TECHNICAL_SYSTEM_DESIGN.md.

Payload requires: ambitious polished TB-123 arcade, start from studio existing assets/style (neon + signal interference from dance-battle + house style), first screen playable, rave-bright reactive core (lanes, polarity switch, dodge glitches, collect pulses, beat-synced combos, escalating), then polish to deadline on controls/feedback/restart/layout/verification/screenshots/PR. 

**Critical:** Multiple rounds of blocking playtest feedback must be addressed in the game itself (not just docs):
- Immediate action, unmistakable polarity/lane, punchy combo feedback.
- Use viewport confidently: more horizontal or strong cabinet, **enlarge player/gates/polarity letters**, unmistakable match/mismatch.
- Real music (acid/rave bass+drums+harmony+build), not blips; toggle-safe.
- **Before next polish:** inspect foundry/assets, reuse or create local authored/procedural + document in ASSET_MANIFEST.md; record blocker if no foundry.

"Previous run issue": asset-guard restart; this launch preserves branch + addresses with ASSET_MANIFEST first.

## Blocking Items To Address First (in order)
1. Asset inspection + ASSET_MANIFEST (17:25) — do before any polish pass. Record foundry blocker, deliver deliberate procedural system for hero elements + music.
2. Music as "real music" (16:50) — composed reactive acid/rave loop.
3. Viewport + size + clarity (11:50,12:18,15:32) — horizontal cabinet, large elements, dual/triple cues for polarity match.
4. Playable taste-gate slice first (WORKFLOW + skill): one verb (polarity ride), one space, browser evidence before systems expansion.
5. Runtime verification must actually run in browser (pageerror, console, in-game state post input).

## Vision / Player Fantasy (one sentence core loop)
"Rave along the acid circuit as a polarity breaker: stay in phase with the scrolling gates by switching lanes and flipping polarity on the beat, dodge glitches, ride pulses for score, chain combos that pump the music and multiplier, and survive the escalating interference as long as you can."

First 30-60s must be interesting and evaluable with zero instructions beyond the first prompt.

## Success Criteria (DoD)
- First screen: title + immediate "click/space to ride" → playable action <2s.
- Core loop fun and clear: lane L/R + polarity flip (space/click) produce instant visible+audible result; gates readable at speed.
- Feedback unmistakable (per playtests): color + huge letter + flash/particle + text label + distinct sound for match vs. drift.
- Music feels composed (bassline with character, drums, movement, build on performance).
- Assets: hero visuals and music are deliberate (documented), not default blobs/bleeps.
- Technical: 60fps, <2MB, self-contained, audio after gesture, large targets, responsive wide layout, restart, clean console in happy path.
- Evidence: VERIFICATION.md with real runtime output, PREVIEW.md, screenshots, updated games index, PR with full context.

## Implementation Order (size steps per risk)
1. **Taste gate (now):** Design slice (player fantasy, controls, framing, feedback, minimal assets list). Implement minimal runnable: scrolling lanes, player (lane+ polarity state), 1-2 gate types, basic collision on "pass line", score on match, simple SFX, click/space start. Verify in browser immediately.
2. **Music engine (critical path):** Build the authored acid/rave sequencer early (patterns + scheduler + energy system). Layer SFX. Add toggles. Tune by ear.
3. **Polish to feedback:** Widen cabinet + frame, enlarge all interactive + polarity glyphs, add unmistakable match/mismatch VFX + particles, beat-sync spawns and scoring accents, ramp patterns, combo/heat UI + music reactivity, restart flow.
4. **Full loop + escalation:** Glitches as real threats, pulses as rewards, heat/combo driven difficulty + music layers, game over + restart.
5. **Integration:** Wire to games/index.html as featured card. Update all durable WO docs.
6. **Verification + PR:** Real browser run (or closest), capture evidence, refresh PR#129 body (include full prompt as WO context), push. Keep polishing game until deadline or hard blocker.

## Tradeoffs
- Single-file HTML (proven in repo by dance-battle) over multi-file for reviewability and preview simplicity.
- Pure procedural authored (canvas draws + Web Audio composed patterns) because no foundry — this is the deliberate system, documented.
- One continuous run with ramp (not discrete levels) to keep first screen the playable experience.
- 2D canvas over Three (simpler, lower payload, perfect for lane clarity and 60fps on mid hardware).
- Music starts on gesture + has mute; we will not fight browser autoplay.

## References
- TB-123 FACTORY_CONTEXT.md (signal/interference aesthetic, noise as evidence, coherence moment).
- Prior dance-battle (neon colors, Web Audio, single-file, cabinet-ish HUD).
- game-designer-2d skill (read): start with fantasy/loop, list assets, proven patterns, first screen playable, review checklist.
- WORKFLOW.md (embedded): taste-gate slice, GitHub branch model, memory files, preview rules, game feel checklist, quality bar.
- All operator feedback in FEEDBACK.md.

Non-goals (not requested): save/load, multi-level select, external assets, achievements, broad settings.
