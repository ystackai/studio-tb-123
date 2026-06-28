# PREVIEW — Acid Circuit Breaker (operator followup)

Work Order: work-order-1781694911130-followup

## Preview Root
Open directly: `games/92-acid-circuit-breaker/index.html`

This is the single self-contained entrypoint. No redirect or homepage mutation.

## How to Preview (local)
1. From repo root: `python -m http.server 8123`
2. Navigate to http://localhost:8123/games/92-acid-circuit-breaker/index.html
3. Click START (first user gesture enables audio). Pre-seeded gates appear immediately for taste-gate.
4. Use ←→ or A/D for lanes, SPACE or center tap/click for polarity flip. M or ♪ for music toggle.
5. Match lane + polarity letter/color on gates to BREAK (watch for beat-phase bonuses). Dodge ! glitches. Collect pulses.
6. Observe: tutorial text on start explains mechanics/AVOID/SCORING/AUDIO REACTIVE; music energy builds.

## Expected First Impression
- Start screen has skimmable 4-panel tutorial (MECHANICS, AVOID, SCORING, AUDIO REACTIVE) using TB-123 concrete language. START still drops instantly into pre-seeded playable slice.
- All prior polish preserved (horiz cab, unmistakable rings/zaps/BREAK pops/red mismatch, PNG heroes, real WAV reactive music).
- Verification artifacts now include the exact expected browser-runtime-post.png .

## Screenshots (captured during this verification pass)
- browser-runtime-start.png (215kB): chromium file:// cap of real index — title + 4 tutorial panels legible + START inside 1380 cab.
- browser-runtime-post.png (215kB): chromium on instrumented driver — post START + lane/pol + injected BREAK (score/particle/zap/accent exercised); HUD visible, no errors.

## Review Notes for Humans
- This followup specifically ensures the verification artifact naming (browser-runtime-post.png) matches factory expectation while carrying forward the tutorial/audio work from parent.
- Game unchanged from last green parent pass except verification evidence.
- Self-contained, <2MB, gesture audio, responsive, 60fps.
- Full browser runtime verification re-executed and passed with the required artifact.

See VERIFICATION.md for runtime evidence and WORKLOG.md for decisions + full context.
