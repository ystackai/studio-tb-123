# Goal Execution Strategy: Continuous Work Order TB-123

Work Order: `work-order-1779415699329-73`  
Implementation Work Order: `Continuous Work Order: TB-123`  
Canonical branch: `factoryx/factory-tb-123/work-order`  
Target repo: `ystackai/studio-tb-123`  
Archetype: `creative_game`  
Strategy gate date: 2026-05-22  
Planning protocol: strategy only. Do not implement production changes, open a PR, or request human review from this gate.

## FactoryX Work Order Context

This document is the durable strategy artifact for the automation-selected Continuous Work Order. Keep all durable planning, feedback, preview notes, verification notes, worklog updates, asset checkpoints, and review-prep material for this pass under `.factoryx/work-orders/work-order-1779415699329-73`.

The concrete brief asks for a coherent small game slice with scoring, progression, or discovery instead of a static presentation. Every meaningful player action should produce feedback through motion, state, and a deliberate sound or music direction. The eventual review PR must make the work easy to evaluate by explaining the brief, implemented scope, verification, remaining risks, and preview instructions.

Planning-gate inspection refreshed on 2026-05-22:

- Workspace: `/workspaces/factory-tb-123/worker-1/ystackai_studio-tb-123/checkout`.
- Current branch: `factoryx/factory-tb-123/work-order`.
- Guarded source head for this gate: `d720f755272e37fe6892982b11649e16e1f2b1ab` (`d720f75 Add strategy for work order 1779415699329`).
- `gh pr view` reported `no pull requests found for branch "factoryx/factory-tb-123/work-order"`, so there is no open PR to update, no review decision to triage, and no PR checks/comments available during this planning gate.
- No `WORKFLOW.md` was present in the materialized workspace.
- `rg` is unavailable in this environment; inspection used `find`, `sed`, and Git/GitHub CLI commands.
- Factory context lists available crew agents: `signal-director`, `interface-coder`, `systems-reviewer`, and `copy-writer`.
- Materialized Work Order strategy context already exists for `work-order-1779413526418-1` and `work-order-1779414251974-24`. Both point toward a static, self-contained synthesizer signal-lab game and identify a shared-shell fetch failure as the key runtime blocker.
- The prompt references `.factoryx/work-orders/work-order-1779414251974-24/FEEDBACK.md`, plus current `PREVIEW.md` and `VERIFICATION.md`; no `FEEDBACK.md`, `PREVIEW.md`, or `VERIFICATION.md` files were present under `.factoryx/work-orders` during this gate.
- The repo appears to be a dependency-light static site. Shallow inspection found `index.html`, `games/index.html`, `drops/index.html`, `drops/1776192003473414045/index.html`, `drops/sacrificial-buffer/index.html`, `blog/`, `personas/`, `team/`, and Studio metadata under `.ystack/`.
- `games/index.html` is a redirect into `/tb-123/drops/`.
- `drops/sacrificial-buffer/index.html` is a single-file audio/slider toy with Web Audio unlock behavior. Preserve it, but do not treat it as satisfying this Work Order; the new release needs a fuller game loop, richer audio identity, and intentional asset direction.

This strategy file is the only intended artifact for the planning gate. Production implementation, generated/runtime assets, preview rewiring, verification evidence, and PR creation are deferred until after this gate is accepted.

## Blocking Feedback To Address First

The most important carried-forward feedback is a browser runtime failure from prior FactoryX context:

`browser runtime verification failed for file:///workspaces/factory-tb-123/worker-1/ystackai_studio-tb-123/checkout/.factoryx-runtime-check-1.html: [19088:19088:0522/023310.674217:INFO:CONSOLE:62] "Uncaught (in promise) TypeError: Failed to fetch", source: https://ystackai.com/shared/studio-shell.js (62)`

Implementation must address that before unrelated polish:

1. Create or select a direct review preview entrypoint for the playable artifact that does not depend on `https://ystackai.com/shared/studio-shell.js`.
2. Verify the intended preview entrypoint before art polish. Any console failure containing `studio-shell.js` or `Uncaught (in promise) TypeError: Failed to fetch` on the review path is a release blocker.
3. If FactoryX runtime verification uses a `.factoryx-runtime-check-*.html` wrapper, keep it valid and minimal: no appended content after `</html>`, no remote Studio shell, and no `file://`-hostile fetch path.
4. Create or update this Work Order's `PREVIEW.md` and `VERIFICATION.md` during implementation with the selected preview path, commands, outputs, screenshots, and the regression result.

## Vision And Player Fantasy

Recommended direction: **TB-123 Signal Lab**, a compact browser-native signal-recovery music game where the player operates a strange field synthesizer and turns interference into a coherent transmission by patching, tuning, sequencing, filtering, and capturing motifs.

The player fantasy is: "I am operating unknown field equipment, and my decisions make noise become music." A reviewer should open the preview and immediately see the playable instrument panel, start audio with a gesture, change a route or sequence step, tune/filter the signal, and improve a visible clarity or lock score in under two minutes.

Audience and reviewer experience:

- Primary audience: short-session reviewers and players evaluating whether the game slice is coherent.
- First screen: the playable signal console, not a landing page, catalog shell, or thin demo.
- Admin/reviewer path: direct preview URL, obvious audio unlock, clear controls, visible score/progression, and no dependency on external instructions to understand the loop.
- Public review narrative: "This is a playable signal-recovery synth game slice with scoring, progression, real audio/visual feedback, and a direct verified preview path."

## Mood, World, References, And Emotional Target

Mood target: warm analog tension, shortwave mystery, and precise signal analysis. The interface should feel like a battered field synthesizer, numbers-station receiver, tape loop, and oscilloscope bench in one compact chassis.

Reference directions:

- Shortwave and numbers-station operation: call signs, buried carriers, coded fragments, tuning drift, lock-on moments, and station interference.
- Modular synthesizer workflow: patch sockets, cable routes, sequencer steps, filters, envelopes, attenuators, meters, and gain staging.
- Oscilloscope and spectrum analysis visuals: traces, spectral bands, VU meters, tape-position readouts, lamps, phase drift, and signal lock.
- Music-game feedback: progression should be felt through groove stability, motif unlocks, cleaner layers, score, combo, and transmission lock.

Emotional target: the machine is unstable, but every correct patch and timing choice makes the signal cohere.

## Core Interaction Loop And Progression

Primary loop:

1. The player presses a clear audio-start control and sees the carrier, meters, and scope come alive.
2. The player selects or patches a signal source into processing modules such as carrier, noise field, filter, delay, sequencer, and decoder.
3. The player tunes frequency, filter cutoff/resonance, and sequence steps to match target bands or motif prompts.
4. Successful alignment raises clarity, score, combo, or transmission lock; poor tuning increases interference and destabilizes visual/audio state.
5. Progress unlocks extra motifs, richer sequence layers, cleaner signal voices, or a final broadcast/readout state.

Minimum reviewable progression arc:

- Calibrate the carrier.
- Discover or lock two to three motif fragments.
- Complete a final transmission state with score, clarity, and a readable result.

Every meaningful action needs multi-channel feedback:

- Start, stop, or mute: audio graph state, transport lamps, waveform activity, and clear locked/unlocked state.
- Patch or source change: audible routing change, cable glow/path state, module meters, and score eligibility.
- Knob or slider movement: smooth Web Audio parameter ramp plus immediate trace/spectrum deformation.
- Sequencer step toggle: audible note/rest change, step light state, beat cursor, and motif score update.
- Successful lock: cleaner harmony or voice layer, decoded phrase fragment, clarity boost, and restrained completion motion.
- Drift or overload: detune/noise, warning lamp, trace instability, and score pressure.

## Art, Audio, And Interaction Direction

Visual identity:

- Compact hardware panel with stable module zones, readable labels, high contrast, and no overlapping text on desktop or mobile.
- State-driven oscilloscope or spectrum canvas as the dominant visual surface.
- Patch bay with persistent socket/cable states instead of abstract blob shapes.
- Sequencer lane with stable buttons, beat cursor, motif state, and active step feedback.
- Transmission objective area with score, clarity/lock, active call sign, and unlocked motif indicators.

Musical identity:

- Base bed: filtered shortwave noise, carrier hum, tape flutter, and a soft analog pulse.
- Voices: at least one melodic or bass oscillator, one noise/signal layer, and one envelope-shaped rhythmic pulse.
- Controls: tuning/frequency, filter cutoff/resonance, sequence steps, gain/mute, and one progression action such as lock/capture.
- Effects: safe delay/filter movement and ramped parameter changes to avoid clicks.
- Browser behavior: audio starts only after a gesture, can be muted/stopped, and degrades gracefully when Web Audio is unavailable.

Interaction principles:

- Controls must be target-sized, focusable, and labeled.
- State changes should be visible without requiring audio.
- Sound changes should remain deliberate and musical, not raw oscillator tests.
- Reduced-motion and muted states should preserve the game loop.

## Real Asset Plan

Procedural rendering is allowed for live signal materials, but central visuals and audio must be intentional assets rather than throwaway primitives.

Runtime asset plan:

- Asset manifest or equivalent documentation listing procedural, authored, generated, and audio runtime assets.
- Hardware panel texture produced through CSS/canvas or committed raster art: worn labels, screws, lamps, grained metal/plastic, and module separators.
- Patch cable assets as stateful canvas/SVG-style paths with route colors, endpoint sockets, glow, disabled states, and clear active routing.
- Scope/spectrum renderer driven by current game/audio state rather than decorative animation.
- Tape or buffer visual showing motif capture/playback position.
- Station typography and copy set: call signs, decoded fragments, motif names, score states, warning states, and completion copy.
- Audio patch manifest: node graph, oscillator types, noise buffers, filter settings, delay settings, envelope timing, and mappings from player controls to sound.

If generated raster assets are created, keep contact sheets, prompts, checkpoints, or source notes in this Work Order directory, and copy optimized runtime assets into the public game path. If all assets are procedural, document why each procedural asset is final-intent art rather than a temporary placeholder.

## Character And Creature Art Plan

This concept does not need embodied characters, enemies, or bosses. The central cast is the hardware and signal system: carrier, noise field, sequencer, filter, tape buffer, decoder, locked motif fragments, and final transmission.

Do not spend initial implementation budget on avatars, mascots, enemy sprites, or boss silhouettes. If a station persona is added later, it should be secondary flavor and must not replace the playable instrument loop.

## Placeholder Retirement Checklist

Do not call the game review-worthy while any central placeholder remains:

- The preview entrypoint is a static studio catalog, marketing page, unrelated homepage, or wrapper that fetches the remote Studio shell.
- The review path depends on `https://ystackai.com/shared/studio-shell.js` or any `file://`-hostile fetch during runtime verification.
- Audio is a single raw oscillator beep without sequencing, filtering, or musical identity.
- Visuals are decorative and disconnected from current synth/game state.
- Player actions change only sound or only visuals, instead of sound, motion, and state together.
- Controls are raw form widgets with no instrument-panel treatment or state feedback.
- There is no progression, score, clarity, discovery, motif unlock, or final transmission state.
- Browser audio unlock, mute/stop, and fallback states are unclear.
- Verification notes lack console/runtime results, interaction checks, and screenshots.

Acceptable final-intent procedural elements:

- State-driven waveform, spectrum, cable glow, meter fills, lamp flicker, and panel grain.
- CSS/canvas knobs and controls if polished, responsive, accessible, and documented.
- Synthetic Web Audio patches if the musical system is structured, expressive, and documented in the asset/audio manifest.

## Engine, Asset Pipeline, Controls, And Verification Implications

Engine choice: keep the implementation static and dependency-light. A self-contained artifact under `games/tb-123-signal-lab/` or `drops/tb-123-signal-lab/` is the lowest-risk path for this repo. Existing studio pages should remain intact, with only minimal navigation/discovery links if needed.

Controls:

- Pointer/touch controls for knobs, sliders, patch/source selection, step toggles, transport, and lock/capture.
- Keyboard support where it helps: Space for start/stop or lock, `R` for reset, number keys for source/patch selection if implemented.
- Focusable controls, visible labels, sufficient contrast, stable hit targets, and reduced-motion behavior.
- No in-app wall of instructions; labels and immediate feedback should teach the loop.

Verification implications:

- Use direct artifact loading and local HTTP preview verification rather than relying on the Factory homepage.
- Include a direct-file or `.factoryx-runtime-check-*.html` regression when feasible because the reported failure happened through `file://`.
- Confirm the intended review entrypoint does not reference `studio-shell.js`.
- Confirm there is no invalid markup appended after a closed HTML document.
- Browser smoke should include console inspection, desktop screenshot, mobile screenshot, and at least one meaningful interaction path.
- Audio smoke should confirm Web Audio initializes only after a gesture, mute/stop works, and control changes are ramped.
- Source inspection should search the new preview artifact and any runtime wrapper for `studio-shell.js`, remote `fetch(` calls, and appended markup after `</html>`.
- Document commands, outputs, screenshots or asset checkpoints, and known limitations in this Work Order's `PREVIEW.md` and `VERIFICATION.md`.

## Implementation Milestone Order

1. Establish a direct, self-contained review entrypoint for the playable game and verify startup without loading or failing through `https://ystackai.com/shared/studio-shell.js`, including a `file://`-shaped regression check when feasible.
2. Build the first-screen playable loop: audio unlock, tuning, routing or source selection, sequencing, score/clarity objective, and visible progression.
3. Replace central placeholders with intentional assets: authored or final-intent procedural hardware texture, readable module/signal silhouettes, stateful patch cables/meters, and documented musical identity.
4. Verify desktop and mobile runtime with screenshots, console checks, audio unlock behavior, interaction smoke tests, and the prior fetch-failure regression.
5. Open or update the single canonical PR only after the slice is reviewable, using `factoryx/factory-tb-123/work-order` and including the required FactoryX Work Order Context, implementation summary, verification output, preview instructions, screenshots or asset checkpoints, and known risks. Since `gh pr view` currently reports no PR for the branch, implementation should create the canonical PR when the artifact is ready rather than opening a planning-only PR.

## Guiding Tradeoffs

- A coherent playable loop beats broad but shallow feature coverage.
- Preserve existing static studio pages and current drops unless a small discovery link is needed.
- Use authored or final-intent procedural assets before adding more modes.
- Make audio/visual coupling the product, not a decorative layer.
- Prefer direct reviewability over platform integration complexity.
- Treat verification as part of the release, especially browser audio unlock and preview loading behavior.
- Keep implementation diffs product-shaped but scoped; avoid unrelated redesigns of the existing site.

## What Not To Build

- No generic platformer, shooter, arena, or unrelated arcade game.
- No marketing landing page as the primary deliverable.
- No multiplayer, accounts, backend storage, leaderboards, or remote save service.
- No long intro before the player can manipulate sound.
- No central hero/enemy/boss art unless the concept changes to embodied characters.
- No stock-like imagery, decorative blobs, or visual effects disconnected from interaction state.
- No production code, generated assets, preview rewiring, or PR creation during this strategy gate.

## Public Progress Updates Worth Sharing

Share public progress only when it carries review-relevant evidence:

- Strategy gate complete on the canonical Work Order branch.
- First playable Signal Lab loop implemented with audio unlock, routing/tuning/sequencing, score/clarity progression, and state-driven visuals.
- Asset checkpoint documents hardware texture, patch cables/meters, signal renderers, and musical patch design.
- Verification checkpoint confirms no shared-shell fetch failure on the review entrypoint, plus desktop/mobile screenshots and audio-unlock behavior.
- PR-ready checkpoint summarizes implemented scope, controls, preview instructions, verification output, screenshots or asset checkpoints, and known risks.

## PR Body Requirements For Implementation Phase

When implementation is ready, the PR body must include:

- FactoryX Work Order Context with the full supervisor prompt/request text.
- Summary of implemented scope and how it satisfies the creative-game brief.
- Direct preview path or URL and concise player controls.
- Art and asset manifest summary, including generated/authored/procedural asset decisions.
- Audio design summary: voices, filters/effects, sequencing, control mappings, and fallback behavior.
- Verification output with commands and results, including the prior `studio-shell.js` fetch-failure regression.
- Remaining risks and known limitations.
