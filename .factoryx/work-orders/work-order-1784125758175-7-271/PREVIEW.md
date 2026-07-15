# Firefly Numbers Station — Preview

**Candidate:** `tb123-signal-portfolio--campaign-1783920863104--candidate-19-time`
**Primary verb:** `time`
**Artifact type:** browser_game2d (single HTML file, Canvas 2D + Web Audio)

## Creative Intent
This should feel like sitting at a vintage numbers station radio: firefly-like signal pulses blink on screen with audio tones, and you must use precise timing to "catch" each pulse and decode its digit before it fades away.

## Gameplay
- **Goal:** Decode 6 firefly digits to reveal the secret message
- **Failure:** Miss 3 signals and the station goes dark
- **3 meaningful decisions per run:**
  1. **Timing** (SPACE): Press at the right moment within the catch window to capture each firefly's digit
  2. **Frequency band** (← →): Shift between LF/MF/HF to match each firefly's frequency — mismatched catches fail
  3. **Lock-on** (hold SPACE 0.5s): Sacrifice 1 second of time to guarantee a catch on the current firefly
- **Escalation:** 6 phases (Calm → Rising → Intense → Chaos → Firestorm → Climax) with faster spawn rates, multiple simultaneous fireflies, and decoy signals

## Controls
- SPACE: Catch firefly (timed) or hold for lock-on
- ← →: Shift frequency band (LF/MF/HF)

## Runtime
Single-file HTML at `dist/index.html`. No external dependencies. Canvas 2D + Web Audio API only.
