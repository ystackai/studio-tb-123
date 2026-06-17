# PREVIEW — Acid Circuit Breaker (follow-on rework)

Work Order: work-order-1781656674208-7-1

## Preview Root
Open directly: `games/92-acid-circuit-breaker/index.html`

This is the single self-contained entrypoint per playbook + prior context. No redirect or homepage mutation.

## How to Preview (local)
1. From repo root: `python -m http.server 8123` (or any static server)
2. Navigate to http://localhost:8123/games/92-acid-circuit-breaker/index.html
3. Click START (first user gesture enables audio). Pre-seeded gates appear immediately for taste-gate.
4. Use ←→ or A/D for lanes, SPACE or center tap/click for polarity flip. M or ♪ for music toggle.
5. Match lane + polarity letter/color on gates to BREAK (watch for beat-phase bonuses). Dodge ! glitches. Collect pulses.
6. Observe: tutorial text on start explains all per operator request; music energy builds with play.

## Expected First Impression (post-rework)
- Start screen now has skimmable tutorial panels: mechanics (lane + flip both to match), what to avoid (glitches = death, wrong lane/pol = combo break + toast), scoring (combo + beat-phase bonuses), audio-reactive (rave loop + layers ramp with survival/combo/level).
- Still drops you straight into the pre-seeded 30s slice on START — no extra clicks or loaders.
- All prior v41 polish (large horiz cab, unmistakable rings/zaps/BREAK pops/red X, PNG assets, real WAV music) preserved.

## Screenshots (captured during verification)
- acid-start-tutorial.png (215kB): chromium http cap — title + 4 tutorial panels (MECHANICS / AVOID / SCORING / AUDIO REACTIVE) + START inside cab; world grid behind; legible neon text.
- acid-mid-play.png (211kB): chromium on instrumented driver — post START interaction (lane+pol actions, injected gate BREAK with particles/zap, HUD/score, beat elements); pre-seed + tutorial overlay not interfering.

## Review Notes for Humans
- The tutorial addresses the exact follow-on operator feedback without changing core gameplay or adding new systems.
- Audio polish is refinements only (ramps, accents on success, restart hygiene).
- Full Game Feel + browser runtime checklist re-applied.
- Self-contained, <2MB, gesture audio, responsive controls, 60fps.

See VERIFICATION.md for runtime evidence and WORKLOG.md for decisions.
