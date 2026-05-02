# Open Circuit — Tutorial Overlay Logic

> The tutorial is a 6-step interactive guide through the "Dark Stage, Bright Performer" aesthetic and the grid's touch mapping. It is designed to feel like part of the instrument, not a separate layer.

---

## Tutorial State Machine

```
LAUNCH (tap overlay)
  → STAGE (step 0, 3.2s) — "The Stage. Dark. Empty. Waiting."
  → INSTRUMENT (step 1, 3.5s) — Highlights all 40 cells: "5 rows × 8 columns"
  → PITCH (step 2, 4.0s) — Highlights row 2, X-axis sweep: "Slide left↔right for pitch"
  → FILTER (step 3, 3.5s) — Highlights column 2, Y-axis sweep: "Slide up↔down for filter"
  → SIGNAL (step 4, 3.5s) — Highlights 5 cells (triad): "OSC → FLT → VCA → Decay"
  → YOUR_TURN (step 5, no auto-advance) — "Touch the grid. Play it." + SKIP button
```

Each step auto-advances after its duration. The final step waits for user interaction.

### Exit Conditions
- **Escape key**: Completes tutorial immediately
- **SKIP button** (step 5 only): Completes tutorial immediately
- **Natural completion**: After step 5, touches or taps on any cell auto-complete the tutorial

---

## Visual Implementation

### Overlay
- Semi-transparent dark layer (`rgba(0,0,0,0.85)`)
- Fades in over 0.6s with `will-change: opacity`
- Positioned `z-index: 9998` (below launch overlay `z-index: 9999`)
- Pointer events only active when `.visible` class is present

### Typography
- **Title**: `(--cover-type-display)`, weight 800, wide tracking (`0.34em`), uppercase
  - High-contrast white (`rgba(255,255,255,0.9)`) with indigo glow text-shadow
  - Matches the "Cover" look: bold, museum-grade, high-contrast
- **Body**: `(--cover-type-mono)`, weight 400, 1.7 line-height
  - Dim indigo (`rgba(99,102,241,0.6)`) — readable but not commanding
  - Subtle letter-spacing (`0.12em`) for technical clarity

### Grid Cell Highlights
- `.tutorial-highlight` class applied to cells relevant to current step
- Glow: 4-layer box-shadow (indigo + purple core)
- Animation: `tutorialPulse` at 1.2s cycle, breathing glow
- Cell label brightens with matching text-shadow

### Sweep Indicators
- **X-axis** (Pitch step): horizontal gradient sweep on row 2, col 2 cell
  - `linear-gradient(90deg)`, translates -30% to +30% over 1.8s
- **Y-axis** (Filter step): vertical gradient sweep on row 2, col 2 cell
  - `linear-gradient(180deg)`, translates -30% to +30% over 1.8s

---

## Audio Wiring

### Tutorial → Signal Chain
When a user touches a highlighted cell during tutorial:
1. `playTutorialCell(cell)` creates a voice via `createVoice(freq, amp, false, r, c)`
2. Voice key: `tut_${row * COLS + col}` — namespaced to avoid conflicts
3. Voice routes through full signal chain: OSC → Filter → VCA → PreDelay → Master
4. After 2s, cell `.active` class removed and voice key deleted from `activeVoices`

### Signal Graph During Tutorial
- `audioVisualLoop` checks `Tutorial.isTutorialActive()`
- Non-highlighted, non-active cells are skipped in the rAF loop
- This reduces DOM writes from 40 to ~5-10 per frame during tutorial
- Prevents visual stutter during tutorial transitions

---

## Transition Timing

| Event | Delay |
|---|---|
| Launch → Tutorial start | 1500ms (after stage reveals) |
| Tutorial overlay fade-in | 0.6s CSS transition |
| Text enter animation | 0.45s ease-out (opacity + translateY) |
| Step auto-advance | step.duration (3.2s–4s) |
| Tutorial fade-out | 0.6s CSS transition + 0.7s DOM removal |

---

## Performance Guarantees

- **Frame budget**: 6ms per frame (inherited from `audioVisualLoop` budget)
- **DOM writes during tutorial**: Capped at 10 per frame, but typically 5-8 (only highlighted cells, skips non-highlighted)
- **No layout thrash**: All tutorial CSS uses compositor-only properties
- **Signal graph dimmed**: Signal graph is dimmed during tutorial to let text breathe

---

## Aesthetic Contract

> **"Dark Stage, Bright Performer" preserved across all tutorial states.**

- The tutorial overlay layer is dark and translucent — stage holds
- Highlighted cells glow bright indigo — performer command attention
- Text is high-contrast white — readable against the dark
- Glow transitions use the same palette (`--cover-cell-active-bg-*`) as active cells
- Progress dots use the indigo/purple palette — no new colors introduced

The tutorial is not a separate UI. It is part of the instrument's interface. The aesthetic remains intact: dark stage, bright glow, Cover typography.

---

## Interaction Flow

```
User opens page
  → Sees black curtain with "Open Circuit" label
  → Taps → launch() fires, audio context starts
  → Stage fades in, sequence plays
  → 1.5s later: Tutorial overlay fades in
  → Step 0: "The Stage" — dark, empty
  → Step 1: "The Instrument" — all cells highlight, then fade
  → Step 2: "Pitch" — row 2 cells highlight, X-sweep
  → Step 3: "Filter" — col 2 cells highlight, Y-sweep
  → Step 4: "Signal Chain" — triad cells highlight
  → Step 5: "Your Turn" — SKIP button appears
  → User taps SKIP or touches grid → tutorial fades out
  → User now in full-play mode
  → Grid glows, signal chain live, no tutorial interference
```

---

> *The tutorial is the bridge between stage and performer. Touch the grid. Play it.*
