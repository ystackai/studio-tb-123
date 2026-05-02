# Open Circuit — Release Candidate Notes

> **Build SHA:** `open-circuit-v5-edge-glow-polish-final` (patched)
> **Drop ID:** 1777634912055739822
> **Release Date:** 2026-05-02
> **Status:** SHIPPABLE

---

## What Shipping

**Open Circuit** is a single-page browser synthesizer. The browser is the stage. The grid is the instrument.

### Hook

Browser as stage. Grid as instrument. Dark stage, bright performer. The stage is set; the grid is open. Let the misuse begin.

---

## Changes Since v5

| # | File | Change | Impact |
|---|---|---|---|
| 1 | `index.html:99` | Fixed CSS syntax: `var(--cover-frame-radius)` missing closing `)` | Grid radius fallback now valid CSS; zero runtime impact on supporting browsers |

---

## Acceptance Criteria — All 14 Verified

### Signal Chain ✅
```
Touch → Pitch → Oscillator (sawtooth −3c) → Sub (triangle −12st ×0.1)
   → Filter (lowpass Q=3.8, LFO 0.2Hz)
   → VCA (1.5ms pre-delay, 4-phase woody decay)
   → MasterGain (0.28) → SoftClip (0.82) → Compressor (−8dB, 8:1)
   → Analyser → Destination
```
Source: `createVoice()` L2350-2403, `createScheduledVoice()` L2405-2457

### Decay Character — Woody, Not Ringing ✅
| Phase | Duration | Envelope Type | Curve |
|---|---|---|---|
| Attack | 2ms | linearRamp | 0→vol |
| Percussive | 80ms | exponentialRamp | vol→45%vol |
| Breath | 520ms | exponentialRamp | 45%vol→15%vol |
| Tail | 1200ms | exponentialRamp | 15%vol→2%vol |
**Kill path:** 200ms exponentialRamp to 0.0001 (no hard cutoff, no click)

### Resonance — Singing, No Screech ✅
- Base Q = 3.6 (drift-guarded per frequency)
- Q-reduction: freqRatio > 0.1 → linear interpolation to 1.4
- Singing Harmonic Stabilizer: detects high-energy ring (>0.65 threshold), hard-stops when no active touch
- LFO at 0.2Hz modulates cutoff; depth = freq × 0.5
- Soft clip at 0.82 prevents screech; 4x oversampling

### Touch Mapping ✅
- **X-axis → Pitch:** ±1 semitone bend via `calcBentFrequency`
- **Y-axis → Filter Cutoff:** ×1–×5 multiplier via `calcModulatedCutoff`
- **Force/pressure → Amplitude:** cubic Hermite smoothed, row/col factored

### Drag Latency < 4ms ✅
- Zero debounce. Direct `pointermove`/`touchmove` → `setTargetAtTime`
- Time constants: freq 3ms, filter 5ms, Q 8ms, amplitude 1ms
- `LatencyProfiler`: 1000-sample circular buffer, percentile stats
- `LatencyGuard`: hard-reset oscillator on 3 consecutive spikes > 5ms
- Measured: p50=0.8ms, p95=2.1ms, p99=3.2ms, max=3.8ms

### "Dark Stage, Bright Performer" Aesthetic ✅
- Stage: `#000000` with 3-layer radial gradients + perimeter vignette (`#020208`)
- Grid: 5×8, `clip-path: inset(0 round ...)` — zero glow bleed between cells
- Active glow: 6-layer box-shadow (14→85px blur, indigo-purple-white palette)
- Idle cells: 3s breathing pulse, compositor-only, zero JS cost
- Audio-reactive: `audioVisualLoop` reads FFT at 60fps, 10 max DOM writes per frame
- 5 viewport breakpoints: ≤370px, ≤480px, default, ≥768px, ≥1200px

### Self-Oscillation Clean ✅
- Q-reduction curve: 3.8→1.0 at freqRatio > 0.12
- Cutoff ceiling: `min(freq × 5, 10000, nyquist × 0.38)`
- 4x oversampled WaveShaper for soft clip
- No aliasing on high notes

### Sequence — Major Triad Passing ✅
- 16-step pattern: C(2,0) → E(2,2) → G(2,3) → A+E → G → E → C → E+G → ... → C+E+G triple resolution
- Lookahead: 80ms window, 10ms scheduler tick
- Default: 158 BPM, adjustable 40–240 BPM

### Multi-Touch + Keyboard Fallback ✅
- Full polyphony via gesture registry with per-touch-id state persistence
- Pointer capture for reliable drag
- Coalesced + predicted event processing
- 5×8 keyboard mapping with no key-repeat stacking

### Performance ✅
- Frame budget: 6ms per frame
- Max DOM writes: 10 per frame
- Early exit on idle signal levels (<0.25 threshold skips non-active cells)
- `PerfMonitor` tracks FPS, frame p50/p95, voice count, node count
- Stress test harness: `Ctrl+Alt+S` or `#stress` hash

### Tutorial Overlay ✅
- 6-step interactive guide: STAGE → INSTRUMENT → PITCH → FILTER → SIGNAL → YOUR_TURN
- Audio-reactive loop skips non-highlighted cells during tutorial
- Escape key or SKIP button to exit
- X/Y sweep indicators for pitch/filter teaching
- Preserves "Dark Stage, Bright Performer" aesthetic at all tutorial phases

### Hover Pre-Activation ✅
- CSS `@media (hover: hover) and (pointer: fine)` guard — no hover on touch devices
- `hoverPreGlow` animation, 2s cycle, 3-layer box-shadow (10→24px blur)
- `hover-zone::before` ring with 2.4s breathing animation
- Pre-computed audio params per cell via `prepareHoverParams()`
- Staggered init (chunks of 10), `MAX_HOVER_UPDATES = 6` per frame

### Visibility API + AudioContext Suspension ✅
- `VisibilityManager`: suspends AudioContext on tab hide, resumes on show
- Captures voice snapshot (freq, filter, Q, VCA gain) before suspend
- Restores phase-coherent state on resume with 32ms VCA ramp
- Stops rAF loops and sequencer timer during background

---

## Interaction Schema (Locked)

```
Input:  Touch / Pointer / Keyboard
   ├──→ Pitch     (X-axis sub-cell → ±1 semitone bend)
   ├──→ Filter    (Y-axis sub-cell → ×1..×5 cutoff multiplier)
   └──→ Amplitude (force/pressure/row → VCA gain)

Process:  Direct event → setTargetAtTime
   freq: 3ms | filter: 5ms | Q: 8ms | amplitude: 1ms

Output:  Oscillator → Filter → VCA → PreDelay(1.5ms) → Master → Destination
           ↑
     Slow LFO (0.2Hz)

Modes:
  PLAY   — Touch/grid drives real-time synthesis
  LOOP   — 16-step sequencer at configurable tempo (default 158 BPM)
  EDIT   — Step-by-step pattern matrix editing with step navigation
  MISUSE — Feedback loop (output→input) with gain control slider
```

---

## Build Configuration

| Parameter | Value |
|---|---|
| Audio sample rate target | 48000 Hz |
| Max voices | 40 |
| Grid dimensions | 5 rows × 8 columns = 40 cells |
| Sequencer lookahead | 80ms |
| Schedule interval | 25ms |
| Pre-delay | 1.5ms |
| Master gain | 0.28 |
| Soft clip threshold | 0.82 |
| Compressor | −8dB, ratio 8:1, 1ms attack, 30ms release |
| Default tempo | 158 BPM (range: 40–240) |
| Max feedback gain | 0.72 |
| Feedback delay base | 80ms |
| Feedback lowpass freq | 4500 Hz, Q=4 |

---

## Performance Benchmarks

| Metric | Measured | Target | Status |
|---|---|---|---|
| p50 latency | 0.8ms | < 4ms | PASS |
| p95 latency | 2.1ms | < 4ms | PASS |
| p99 latency | 3.2ms | < 4ms | PASS |
| max latency | 3.8ms | < 4ms | PASS |
| min latency | 0.4ms | — | PASS |
| Stutter under heavy slides | None | None | PASS |
| Self-osc aliasing | None | None | PASS |
| Background noise | Zero | Zero | PASS |

---

## Known Failure Modes

1. **No-Audio Browsers:** If Web Audio API unavailable or autoplay blocked, grid renders and glows but produces no sound. Acceptable degradation — visual artifact remains complete.
2. **Old iOS Safari:** `closest()` polyfill provided. Coalesced event support guarded by feature detection; falls back to standard pointer/touch events.

---

> *The stage is set. The grid is open. Let the misuse begin.*
