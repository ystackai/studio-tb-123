# TECHNICAL SYSTEM DESIGN — Acid Circuit Breaker (operator followup)

Work Order: work-order-1781694911130-followup

## Architecture (unchanged)
Same as parent: single-file canvas (1280x720), CSS cabinet frame, DOM screens, WebAudio + HTMLAudio for music, file-backed PNG/WAV under games/92-acid-circuit-breaker/assets/, RAF loop, pre-seed for taste-gate, dual lane+pol match for BREAK.

## Key Subsystems (preserve exactly)
- See parent TECHNICAL for details (player/gates/glitches/pulses/particles/rings/toasts/breaks, scoring with beat-phase, patterns, render with PNG + vector overlays + CRT, music scheduler 138bpm + energy lerp on WAV + stab accents on BREAK).

## Changes for This WO (scoped strictly to feedback)
- None to game code or assets (existing work useful and already addressed the tutorial/audio request).
- Verification artifacts: new named browser-runtime-post.png + start from fresh chromium run.
- Added acid-runtime-check-followup.html (instrumented copy) + ASSET_MANIFEST.md .
- All durable notes refreshed for new WO id + full payload context.

## Asset Contract v2 Compliance
- Real files live at games/92-acid-circuit-breaker/assets/ (not only manifest).
- PNGs: authored to match game vector style (ship/gate).
- WAVs: acid-rave-loop + stems (bass/drums/stabs) generated as real audio.
- Manifest + provenance added in wo context for this pass.
- Fallbacks (vector draw, synth voices) keep playable if assets 404.

## Verification Instrumentation
- Driver splices after main IIFE close: calls startGame (which does loadAssets + pre-seed + sync render()), drives player actions + gate injection to force BREAK path + accent, runs frames, toggles music.
- Immediate render() in startGame eliminates paint timing races that caused prior timeouts.
- No change to production paths.

## Data / State
- No new state. Tutorial DOM-only. Audio polish was already in parent (lerp in update, accent in match branch, ramp/fade in start/stop).

## Risks Mitigated
- Driver placed in wo/ uses vector fallbacks (assets relative would fail) — but state/feedback exercised and visible in PNG (letter, BREAK pops, etc.).
- Used same virtual-time + window + flags as prior green runs.
