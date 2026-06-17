# TECHNICAL SYSTEM DESIGN — Acid Circuit Breaker (follow-on)

Work Order: work-order-1781656674208-7-1

## Architecture (unchanged from v41 base)
- Single-file HTML5 canvas game (1265 LOC incl styles + script IIFE).
- 1280x720 internal res, CSS cab frame (1380px max, sides, tall bezels) for strong horiz presence.
- Pure DOM + canvas: no frameworks. requestAnimationFrame loop (update + render).
- State machine: START / PLAYING / GAMEOVER. Screens are absolutely positioned overlays.
- Input: kbd, pointer on canvas (thirds), dedicated full-height touch divs, buttons.
- All assets self-contained (PNG under assets/, WAV under assets/).
- Audio: WebAudio (procedural acid synth scheduler in update) + HTMLAudioElement for committed WAV loop. Strictly post-gesture (initAudio on first START/center/RETRY or music btn).
- No network, no storage, no workers. Offline after load.

## Key Subsystems (preserve exactly unless noted)
- Player: lane (0-2) + polarity (0-2), eased x target, y fixed.
- Entities: gates (lane+colorIdx), glitches (kill), pulses (score+combo), particles, breaks (arc zaps), toasts (miss labels), warnings (glitch !), polRings, matchPops.
- Spawn + patterns: timer + level (dist/2000) driven; pre-seed in startGame for taste-gate; escalating at LVL>=2.
- Collision/score: gates test lane+pol match (beat-phase bonus if near peak); glitches AABB kill; pulses radial collect. Combo decay idle, maxCombo track.
- Render: full redraw every frame; PNG underlay + vector overlays for live state (rings, X, letter inside ship/gate); beat-reactive bg/grid; CRT vignette/scanlines via CSS + canvas.
- Music: 138bpm 16-step scheduler (advanceMusic called every update); bass slides + resonant filter + LFO + drums (kick/snare/hat) + stabs. Energy = f(level,combo,dist) drives filter, density, stab rate. musicAudio WAV bed with playbackRate + volume scaled to same energy.
- SFX: discrete playTone / playDrumVoice on actions (polarity, gate pass, collect, glitch death, level).
- Pre-seed + immediate render() at tail of startGame: critical for deterministic browser verification (no paint race).

## Changes for This WO (scoped)
1. Start Screen / Tutorial (DOM only):
   - Edit #start-screen innerHTML or add child elements (still .screen).
   - New content: short headings + 1-2 sentence explanations for mechanics, hazards, scoring incentives, audio reactivity.
   - Style: reuse existing .screen-title, .screen-subtitle, .controls-hint, .screen-btn. Add micro classes or inline for "tutorial-grid", "callout" if needed (keep diff small, no new CSS bloat).
   - No JS behavior change: START still calls startGame() which does pre-seed + render + startMusic.
2. Audio Polish (additive inside existing fns):
   - startMusic / stopMusic: add volume ramp (gain or element volume fade), ensure single instance, clean currentTime=0 on restarts.
   - update: smooth the energy-driven musicAudio.playbackRate/volume (e.g. lerp toward target instead of direct assign).
   - On gate success (inside the match branch): call a lightweight accent fn (e.g. playMelodicStab or new short playTone with musical freqs) so BREAK feels sonically "tuned".
   - Guards: if(!musicAudio) checks, try/catch around all audio to prevent any runtime throw on odd browser.
   - No change to MUSIC_BPM, patterns, scheduler, synth graph, toggleMusic, or sfx fns.
   - Stems remain present for review (ASSET_MANIFEST context) but not auto-mixed unless prior code already did (preserve).

## Data / State (no new top level state)
- Tutorial is pure DOM/content; zero game state added.
- Audio polish uses existing musicEnabled, musicAudio, bass* nodes, energy calc already in update.

## Performance / Payload
- Tutorial: static DOM, zero impact on 60fps loop or hot paths.
- Audio: same node count + scheduler; lerp is cheap. Still <<2MB (WAVs dominate at ~612kB + PNGs ~16kB).
- Verification must re-confirm no regression in frame times or load.

## Browser / Compatibility Notes
- AudioContext + <audio> loop + playbackRate: standard, already exercised in v40/v41 verif.
- PNG drawImage + fallback: already robust.
- Gesture requirement: unchanged (all entry points call initAudio before play()).

## Testing / Evidence Points
- startGame still produces pre-seeded immediate state + sync render().
- Post START: lane change visible (targetX + particles), polarity cycle (letter + ring + sfx), gate passage (match or toast), BREAK accent audible.
- Music toggle before/after start, restart hygiene (no stacking audio).
- chromium renders show tutorial text + mid state without errors.

All other design (culling, object pools via splice, beatInterval calc, shake/flash, etc.) untouched.
