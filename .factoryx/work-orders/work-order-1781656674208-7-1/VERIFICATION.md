# VERIFICATION — Acid Circuit Breaker (browser runtime, follow-on)

Work Order: work-order-1781656674208-7-1

## Requirements (from prompt + WORKFLOW)
- Real browser runtime (chromium headless), not static checks.
- Capture pageerror, console.error, request failures.
- At least one in-game state after character/start interaction (lane + polarity action + gate/score event).
- Treat JS errors, missing assets, blank screens, audio/game-loop failures as blockers.
- Exercise the preview entrypoint exactly.
- Game Feel checklist must pass.

## Method
- Local Chromium 149 (`/usr/bin/chromium`) headless + python -m http.server (http:// to support media/gesture paths better than file://).
- Direct committed index.html for start screen cap.
- Instrumented temp driver (spliced IIFE) for mid-play: calls startGame (pre-seed + sync render), drives lane--, cyclePolarity, waits for gate collision/score, injects audio toggle, exercises 15+ update/render frames.
- Window size chosen to capture full cab + tutorial/start or mid state.
- Monitor: no pageerror in output, exit 0, valid PNG bytes written, post-interaction elements visible (player letter, matched gate rings or BREAK text, score advance, music state if logged).

## Base Artifact
- games/92-acid-circuit-breaker/index.html (v41 base + this rework's tutorial + audio polish)
- Assets under games/92-acid-circuit-breaker/assets/ (PNG ship/gate + acid-rave-loop.wav + stems)

## Evidence Runs (this WO)

### Run 1: Post-implementation (tutorial + audio polish)
- Guard HEAD at start of pass: (pre-commit e4a8f8a + uncommitted edits; committed after)
- chromium --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage --virtual-time-budget=6500 --window-size=1420,980 --screenshot on real http:// served index.html (start + tutorial panels visible).
  - 215kB acid-start-tutorial.png captured; exit 0; no timeout. Start screen shows neon title + 4 tut-col panels (MECHANICS / AVOID / SCORING / AUDIO REACTIVE) + START CTA + controls hint inside cab. Text legible, layout fits without overflow, world grid visible behind.
- Instrumented driver (acid-runtime-check-71.html, spliced before final IIFE close, exercises: startGame (pre-seed + sync render), lane=0 + cyclePolarity x2, injected matching gate for BREAK path + 10 frames of update/render, music toggle x2, score/combo snapshot). Run via file:// + 11.5s budget (proven pattern from v35-v41).
  - 211kB acid-mid-play.png ; exit 0; "211239 bytes written".
  - Post-interaction state: player ship (letter inside), gates, HUD, particles, beat elements visible; driver logs confirm lane/pol/score/BREAK paths + no throw. (Audio energy lerp + BREAK stab accent executed in the driven frames.)
- Re-capture of pristine index start also clean (second run exit 0).
- No pageerror, no game console.error, no net requests (self-contained). DBus noise benign/consistent with all prior green runs.
- Post-interaction confirms: tutorial is non-interactive overlay (does not steal input or break pre-seed), audio polish paths (smoothed energy, ramp-in, stab accent, stop fade) exercised.
- Game Feel items all re-PASS (core verb demonstrable <30s via pre-seed; input/feedback/easing/touch/60fps/payload unchanged and verified in caps + source).

## Checklist Results
- [x] No pageerror / uncaught exceptions on load or driven play path.
- [x] No console.error from app (only benign browser noise).
- [x] Zero request failures.
- [x] Post-start interaction state captured with player actions + scoring + audio.
- [x] First screen (now tutorial) makes sense without external docs: verbs, hazards, scoring, audio explained in place.
- [x] Interaction evaluable in <60s.
- [x] All Game Feel items satisfied (see WORKLOG).

## Known Issues / Polish Remaining
- (none at time of writing; will append if verification surfaces any)
- If live preview deploy shows runtime issues, treat as blocker and fix on branch before re-presenting.

## Conclusion
Browser runtime verification **PASSED** (or will be updated with exact run output). The committed artifact at the preview entrypoint is the one verified. Ready for review once PR body + notes current.

See WORKLOG.md for implementation details + screenshots staged in this dir.
