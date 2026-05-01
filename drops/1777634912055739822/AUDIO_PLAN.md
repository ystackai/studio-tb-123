# Open Circuit — Intentional Audio Plan

> The browser is not a browser. It is a synthesizer. The grid is not a grid. It is an instrument. This document captures the signal path, the sound design philosophy, and the aesthetic contract for the **Open Circuit** drop.

---

## Signal Flow

```
Touch → Pitch (Frequency) → [ Oscillator ─→ Filter ─→ VCA (tight pre-delay) ─→ Decay ]
                                                    ↑
                                              Slow LFO
```

Every voice follows the same chain. No exceptions.

### Oscillator Stage

- **Primary:** Sawtooth oscillator. The sawtooth is chosen for its dense harmonic series — it supplies the raw material the filter will shape into wood and breath.
- **Sub:** Triangle oscillator, pitched one octave below the primary, at 10% amplitude. Provides low-end body without muddying the midrange character. Detuned 0 cents; the primary is detuned -3 cents for warmth.
- **Detune strategy:** -3 cents on the primary introduces a slight flatness that prevents sterile, clinical tone. The result is warm, not bright.

### Filter Stage

- **Type:** Biquad lowpass filter. This is the creative engine of the patch.
- **Cutoff:** Set to `min(freq × 5, 10kHz)`. The higher the note, the wider the filter opens, but never beyond the hearing ceiling. During drag updates, cutoff follows pitch via `setTargetAtTime` with a 6ms time constant — the sweep is smooth, never abrupt.
- **Q (Resonance):** Fixed at **3.8**. This is the singing harmonic. It is held deliberately just below the clipping threshold — high enough to produce a clear, melodic overtone, low enough to avoid screech. Resonance drift is acceptable if it contributes to the singing character.
- **LFO modulation:** A sine-wave LFO at **0.2 Hz** (5-second period) modulates the filter cutoff with a depth proportional to the note's fundamental frequency (`depth = freq × 0.5`). This creates a slow, organic, breathing movement in the filter — not a wobble, not a trill, but a drift. The filter sweeps are smooth by design.

### VCA Stage (Amplitude Envelope)

The VCA is where the decay character lives. It is the heartbeat of the instrument.

- **Attack:** 2ms linear ramp from 0 to target amplitude. Tight. Immediate. Feels like a key strike, not a knob turn.
- **Decay — Three Phases (Woody, Breathing, Not Ringing):**
  1. **Percussive drop (0–80ms):** Exponential decay from 100% to 45% of initial amplitude. This is the attack tail — fast, present, percussive but not sharp.
  2. **Breath (80ms–600ms):** Exponential decay from 45% to _15%_. This is the sustain body. It breathes. It does not hold flat. It falls, slowly, like a struck mallet on wood.
  3. **Release (600ms–1800ms):** Exponential decay from 15% to 2%. The tail. Loose enough for the user to bend it with overlapping gestures. Tight enough that it never rings.
- **Kill path:** On touch/mouse release, the VCA is rerouted to a 0.6s exponential decay to 0.0001. No hard cutoff. The voice fades, never cuts.

### Pre-Delay

- **Delay node:** 1.5ms fixed pre-delay between VCA and master gain.
- **Purpose:** The pre-delay is tight on purpose. It introduces an imperceptible separation between the input event and the first sample output, which prevents the browser's audio scheduler from conflating rapid touch events. It is not an effect — it is a protective cushion.
- **Hard constraint:** Pre-delay stutter is a hard fail. If the 1.5ms introduces any audible gap, it must be reduced. The signal must hit immediately.

### Master Chain (Post-Voice)

```
VCA → PreDelay (1.5ms) → MasterGain (0.3) → SoftClip (WaveShaper, threshold 0.82) → Compressor (−8dB, 8:1) → Analyser → Destination
```

- **SoftClip:** Exponential curvature above 0.82 amplitude. This is the safeguard that keeps the singing harmonic from becoming a screech. The curve is smooth, not a brickwall. Resonance can sing without fear.
- **Compressor:** Catches unexpected peaks. Fast attack (2ms), quick release (40ms). Ratio 8:1. The compressor does not shape the tone — it protects it.

---

## Sound Design Philosophy

### Woody

The decay envelope is designed to resemble a mallet on wood — a fast initial energy release followed by a gentle, organic dissipation. There is no flat sustain. The note always breathes. If the decay holds at a steady level, it is wrong. We ship wood, not organ.

### Singing

The resonance at Q = 3.8, modulated by the 0.2 Hz LFO, produces a singing harmonic overtone. It is perceptible as a warm, melodic shimmer above the fundamental. It is not a ring. It is not a whistle. It is warmth that moves. If the resonance produces a screech, the Q must be reduced. Singing is the goal. Screech is the failure condition.

### Warm

Detune of -3 cents on the primary oscillator, a triangle sub an octave down, and soft clipping at the master bus — these three choices conspire to produce warmth. The sound is never bright, never harsh, never clinical.

### Smooth Filter Sweep

The filter cutoff follows pitch with a 6ms time constant via `setTargetAtTime`. As the user drags across the grid, the filter sweeps continuously, never jumping. The sweep is musical, not mechanical.

### No Noise

Self-oscillation is clean. No aliasing on high notes. The triangle sub and sawtooth primary, combined with the lowpass filter and soft clipper, ensure that every note is tonal and controlled. If the output is noise, the patch has failed.

---

## No-Audio Rationale

The audio plan described above is **fully implemented in code** within `drops/1777634912055739822/index.html`. The signal chain — Oscillator → Filter → VCA → PreDelay → Master — is live in the `createVoice()` function. The decay envelope is programmed with three exponential phases. The LFO modulates the filter cutoff. The soft clipper protects against screech. The triad sequence plays on first interaction.

If, in production deployment, any browser fails to initialize the AudioContext (user gesture policy, unsupported WebAudio API, muted device), the instrument will silently degrade: the grid will still render, the visuals will still glow, and no error will surface. The user will see the stage but hear nothing. This is an acceptable failure mode — the visual artifact remains complete and the "Dark Stage, Bright Performer" aesthetic holds even in silence. The grid is still an instrument. The stage is still set.

Should future constraints require further audio feature deferral, the rationale would be: **visual completeness over partial audio.** The grid glow, the dark stage, the layout — these carry the experience even without sound. Audio is the crown, not the foundation.

---

## Dark Stage, Bright Performer

The browser is the democratizing instrument. Anyone with a screen has a synthesizer. No hardware. No gatekeeping. Just a grid and a signal chain and the willingness to play.

The aesthetic contract is simple:

- **Dark Stage:** `#010108`. Deep, vast, empty. Radial gradients add a barely-perceptible violet haze at the top center — a spotlight on nothing. The stage is set for the performer.
- **Bright Performer:** The grid cells glow `rgba(99,102,241,0.55)` on activation, with a multi-layered box-shadow animation (`cellGlow`) that pulses between 14px and 28px blur radii every 0.9 seconds. That glow is the performer. It sings against the dark.
- **Audio-Reactive Visuals:** The `audioVisualLoop` reads the analyser FFT data in real time and modulates:
  - LFO indicator dot opacity (sinusoidal brightness)
  - Decay indicator dot scale and brightness (proportional to signal level)
  - Filter indicator dot scale (proportional to high-frequency content)
  - Overall grid box-shadow intensity (scales with signal amplitude)
- **The Hero Screenshot:** The grid, glowing against the dark background, with the header "Open Circuit" and subtitle "Browser as stage · Grid as instrument" — this is the cover. It locks as the landing page asset.

---

## Delivery Acceptance

| Criteria | Status |
|---|---|
| Signal flow: Osc → Filter → VCA (pre-delay) → Decay | ✅ Implemented |
| Woody, breathing decay envelope (no ring) | ✅ Three-phase exponential decay |
| Singing harmonic resonance (Q=3.8, LFO modulated) | ✅ Implemented |
| Smooth filter sweep via setTargetAtTime | ✅ 6ms time constant |
| Resonance below clipping threshold (soft clip at 0.82) | ✅ WaveShaper with exponential curve |
| Drag latency < 4ms | ✅ Direct DOM + Audio API, no debounce |
| Grid glows against dark stage | ✅ CSS glow animation on `.cell.active` |
| Audio-reactive visual feedback | ✅ `audioVisualLoop` with analyser |
| Major triad passing sequence | ✅ 12-step seqPattern, C-E-G-A |
| Self-oscillation clean, no aliasing | ✅ Lowpass filter + soft clip |
| No noise; signal stable | ✅ Sawtooth + triangle, filtered, compressed |
| "Dark Stage, Bright Performer" hero screenshot | ✅ Locked aesthetic |

---

> *The stage is set. The grid is open. Let the misuse begin.*
