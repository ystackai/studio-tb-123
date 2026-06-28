# Technical System Design - Acid Circuit Breaker

## Architecture Overview
Single self-contained `games/92-acid-circuit-breaker/index.html` (HTML + inline CSS + JS IIFE). No build, no external runtime assets (except optional CDN none — pure).

- **Rendering:** HTML5 `<canvas>` 2D context. Internal resolution e.g. 960x540 or 1024x576 for crisp pixel arcade feel; CSS scales the cabinet container responsively to viewport while preserving aspect and minimum element sizes.
- **Input:** Keyboard (addEventListener keydown/keyup) + Pointer (click/mousedown on canvas or overlay buttons, with hit zones for lanes). Passive listeners where possible. Large on-screen buttons for polarity + toggles.
- **Game Loop:** `requestAnimationFrame` → update(dt) → draw(). Fixed internal timestep feel with dt clamp. Spawn timing driven by music beat scheduler where possible.
- **State:** Single `state` object (player.lane, player.polarity, score, combo, heat, running, lastBeat, etc.). Immutable-ish pattern for spawns (array of active gates/pulses/glitches with t, lane, polarity, etc.).
- **Collision / "Pass" Line:** A fixed horizontal "breaker bar" Y. When an entity's Y crosses it, resolve: if gate, test lane + polarity match → score/combo or shock/break; if pulse → collect; if glitch → always damage if overlapping lane.
- **Easing / Feel:** All player lane changes use lerp + ease; polarity flip has 60-80ms flash overlay. Gate approach speed ramps slowly. Particles have velocity + gravity-ish + fade.
- **Audio:** Web Audio (AudioContext created on first gesture). Dedicated `MusicEngine` and `SfxEngine`.
  - MusicEngine: lookahead scheduler (currentTime + 0.1), 16th grid at 142bpm, pattern data (arrays of midi notes or triggers), multiple voices (bass oscs + filter, drum noise+osc, stab group). `setParam` curves for cutoff, gain, Q on heat/combo. `start()` / `stop()` safe.
  - SfxEngine: one-shot playTone/playNoise helpers with short envelopes; distinct profiles for flip/match/miss/collect/combo.
- **Particles:** Simple array of {x,y,vx,vy,life,color,size, type}. Max 80-100. Drawn with globalAlpha per life.
- **Beat Sync:** MusicEngine exposes `getBeatPhase()`, `getBar()`, `getNextBeatTime()`. Spawners use it so gates/pulses land near musical events. Successful on-beat matches (within window of beat) get +bonus + visual accent.
- **Escalation:** `heat` (0-1) derived from combo + survival time. Increases scroll speed slightly, spawn density, % of forced polarity changes, glitch chance. Also feeds music heat (layer count, filter openness).

## Visual Layering (drawn bottom to top)
1. Cabinet bezel / marquee (CSS + canvas accents)
2. Background acid grid + moving traces (phase offset per lane for "circuit" depth)
3. Scanlines + light noise texture (every frame, low opacity for signal feel)
4. Entities (glitches behind, pulses, gates, player)
5. Particles
6. "Breaker bar" (subtle glow line at resolve Y)
7. HUD (score, multiplier, heat bar, music status — large fonts, stroked)
8. Overlays (start prompt, game over, pause)

Glow technique: for neon elements, draw 3-4 passes (wide low-alpha shadowBlur + core bright stroke/fill). Polarity letters use font + extra outline strokes.

## Polarity & Matching Rules (unmistakable)
- 2 states: 0='A' (acid green #39ff14), 1='B' (hot magenta #ff00aa). (Can extend to 3 if space.)
- Player always shows current letter + saturated fill + thick outline.
- Each gate has required polarity + letter.
- On cross: 
  - lane == gate.lane AND polarity == gate.polarity → PHASE LOCK (bright cyan/magenta burst particles, +100*mult, combo++, music stab accent if on beat)
  - else → PHASE DRIFT (red/orange crack particles + edge flash, combo=0, -50 or health pip)
- Visual: next 1-2 upcoming gates have preview "ghost" or brighter label so player can pre-switch.
- On polarity flip: 80ms white+color flash on player + radial 6-particle zap + short whoosh SFX. State changes instantly.

## Music Design (authored, see ASSET_MANIFEST)
Patterns are hand-written 16-32 step sequences.
Bass: [note, vel, slideTo, accent] tuples. Two oscs (saw main + detuned square), BiquadFilter lowpass with modulated cutoff (LFO + per-note env).
Drums: separate trigger arrays for kick/hat/snare. Each has a `play(time)` that creates short-lived osc/noise + gain + filter nodes.
Stabs: chord definitions (arrays of freqs), triggered on phrase boundaries or high heat.
Scheduler: queue events in a rolling window, cancel or duck on stop. Heat affects:
- cutoff max
- extra voice gain
- drum density or variation
- global gain
- occasional riser noise before strong downbeats

All timing in AudioContext time, not wall time, for stability.

## Controls & Responsiveness
- Lane: 4 lanes, 0-3. Player visual X lerps to lane center on input.
- Polarity toggle: edge triggered (keydown Space or button mousedown), not held.
- Click zones on canvas: left 40% → lane-1, right 40% → lane+1, center or bottom button → polarity.
- Dedicated DOM buttons (positioned over cabinet) for POLARITY (huge), MUSIC, SFX — pointer-events all, min 48px.
- R key anywhere (when !running or always) → restart().
- Resize: recompute scale, but keep game logic in fixed "world" units; draw uses scale factor. Text sizes clamped to min.

## Data / Config (easy to tune)
```js
const CFG = {
  bpm: 142,
  lanes: 4,
  scrollSpeedBase: 140, // px/s
  gateHeight: 78,
  playerSize: 82,
  polarityFlashMs: 70,
  comboTiers: [4,8,16],
  heatRamp: {time:0.0008, combo:0.012},
  ...
};
```
Patterns in code as const arrays.

## Performance & Constraints
- 60fps target: cap particles, simple path ops, no per-pixel, shadowBlur used sparingly (only on key neon elements).
- Payload: inline everything. Font stack system sans + bold for letters. No images.
- Audio voices: limit concurrent, reuse nodes where safe, or short lifetimes.
- Mobile: viewport meta, no horizontal scroll, large hit areas, test tap not drag.

## Verification Hooks
- Expose `window.ACID_STATE` (read-only snapshot) or console command for harness to inspect score/combo/running after simulated input.
- No remote scripts in the game file itself (games/index.html update is static link only).

## Risks & Mitigations
- Music timing drift: use AC time + lookahead + bar/beat math.
- "Tiny elements" regression: enforce min sizes in CFG + CSS, test at 320px and 1920px widths.
- Browser audio unlock: all start paths go through a gesture that resumes AC if suspended.
- PR history: we are overwriting game on shared branch; body will clearly state new WO + new preview + that dance-battle was prior artifact.

## Changes From Prior (dance-battle)
- 2D canvas lane runner vs 3D city.
- Polarity + match gate verb vs dance rhythm overlay.
- Strong authored music vs simple beat blips.
- Focus on one tight arcade screen vs open world.
- Addresses specific playtest constraints on size, music, assets.

This design is intentionally narrow and deep for the taste-gate + polish budget.
