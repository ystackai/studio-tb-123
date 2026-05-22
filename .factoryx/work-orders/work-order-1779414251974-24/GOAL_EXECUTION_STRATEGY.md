# Goal Execution Strategy: Continuous Work Order TB-123

Work Order: `work-order-1779414251974-24`
Implementation Work Order: `Continuous Work Order: TB-123`
Canonical branch: `factoryx/factory-tb-123/work-order`
Target repo: `ystackai/studio-tb-123`
Archetype: `creative_game`
Planning protocol: strategy gate only; do not implement production changes or open a PR from this gate.

## FactoryX Work Order Context

This is the durable strategy artifact for the Continuous Work Order selected by automation. Keep all durable planning, feedback, preview, verification, and worklog notes for this pass under `.factoryx/work-orders/work-order-1779414251974-24`.

The concrete brief asks for a small game slice with scoring, progression, or discovery instead of static presentation. Every meaningful player action should produce feedback through motion, state, and deliberate sound or music direction. The later review PR must make the request easy to evaluate by explaining the Work Order context, implemented scope, verification output, preview instructions, screenshots or asset checkpoints, and remaining risks.

Current planning-gate inspection on 2026-05-22:

- The workspace is already on the required canonical branch, `factoryx/factory-tb-123/work-order`.
- The refreshed branch head is `df97966d3015ec3b171e9f6d8bb8ad8a153bfa69`.
- `git status --short --branch` showed a clean branch before this strategy update.
- `gh pr view --json number,title,state,headRefName,url,reviewDecision,comments,reviews,statusCheckRollup` reported no pull requests found for this branch, so there are no current PR reviews, comments, checks, or requested changes to triage during this gate.
- No `WORKFLOW.md` was materialized in the workspace.
- `find .factoryx/work-orders -maxdepth 3 -type f -name 'FEEDBACK.md'` found no materialized playtest feedback files. The supervisor prompt and the prior strategy at `.factoryx/work-orders/work-order-1779413526418-1/GOAL_EXECUTION_STRATEGY.md` are therefore the available feedback and art-direction inputs.
- The repository is a dependency-light static site with public HTML surfaces including `index.html`, `games/index.html`, `drops/index.html`, `drops/sacrificial-buffer/index.html`, `blog/`, `personas/`, `team/`, `studio.json`, and `.ystack/` state.

The previous run issue is blocking and must be addressed before peripheral polish: browser runtime verification failed for `file:///workspaces/factory-tb-123/worker-1/ystackai_studio-tb-123/checkout/.factoryx-runtime-check-1.html` with `Uncaught (in promise) TypeError: Failed to fetch` from `https://ystackai.com/shared/studio-shell.js` line 62. The first implementation milestone must create or select a direct preview entrypoint for the playable artifact that does not depend on the remote shared Studio shell. Verification must prove that the review entrypoint does not reproduce this failure before time is spent on art flourishes, navigation polish, or PR-body-only work.

Implementation milestone order after this strategy gate:

1. Establish a direct, self-contained review entrypoint for the playable game and verify startup without loading or failing through `https://ystackai.com/shared/studio-shell.js`.
2. Build the first-screen playable loop: audio unlock, tuning, routing or source selection, sequencing, score/clarity objective, and visible progression.
3. Replace central placeholders with intentional assets: authored or final-intent procedural hardware texture, readable module/signal silhouettes, stateful patch cables/meters, and documented musical identity.
4. Verify desktop and mobile runtime with screenshots, console checks, audio unlock behavior, interaction smoke tests, and the prior fetch-failure regression.
5. Open or update the single canonical PR only after the slice is reviewable, using this branch and including the required FactoryX Work Order Context, implementation summary, verification output, preview instructions, and known risks.

## Vision And Player Fantasy

The recommended product direction remains **TB-123 Synthesizer Signal Lab**: a browser-native signal-recovery music game where the player operates strange analog hardware and turns interference into a coherent transmission by patching, tuning, sequencing, filtering, and capturing motifs.

The player fantasy is: "I am operating unknown field-synth equipment, and my decisions make noise become music." A reviewer should open the preview and immediately understand that they can start audio, manipulate controls, hear the instrument change, see the signal react, and improve a visible clarity or lock score.

The audience is a short-session reviewer or player. The experience should teach itself through labels, direct manipulation, immediate feedback, and a compact objective, not through a marketing landing page or long instruction screen.

## Mood, World, References, And Emotional Target

Mood target: warm analog tension, shortwave mystery, and precise signal analysis. The interface should feel like a battered field synthesizer, numbers-station receiver, tape loop, and oscilloscope bench in one compact chassis.

Reference directions:

- Shortwave and numbers-station operation: call signs, buried carriers, coded fragments, tuning drift, lock-on moments, and station interference.
- Modular synthesizer workflow: patch sockets, cable routes, sequencer steps, filters, envelopes, attenuators, meters, and gain staging.
- Oscilloscope and spectrum analysis visuals: traces, spectral bands, VU meters, tape-position readouts, lamps, phase drift, and signal lock.
- Music-game feedback: progression should be felt through groove stability, motif unlocks, cleaner layers, score, combo, and transmission lock.

Emotional target: "The machine is unstable, but every correct patch and timing choice makes the signal cohere."

## Core Interaction Loop And Progression

Primary loop:

1. The player presses a clear audio-start control and sees the carrier/scope come alive.
2. The player selects or patches a signal source into processing modules such as oscillator, noise, filter, delay, sequencer, and decoder.
3. The player tunes frequency, filter cutoff, resonance, and sequence steps to match target bands or motif prompts.
4. Successful alignment raises clarity, score, combo, or transmission lock; poor tuning increases interference and destabilizes visual/audio state.
5. Progress unlocks extra motifs, richer sequence layers, cleaner signal voices, or a final broadcast/readout state.

Every meaningful action needs multi-channel feedback:

- Start, stop, or mute: audio graph state, transport lamps, waveform activity, and clear locked/unlocked state.
- Patch or source change: audible routing change, cable glow/path state, module meters, and score eligibility.
- Knob or slider movement: smooth Web Audio parameter ramp plus immediate trace/spectrum deformation.
- Sequencer step toggle: audible note/rest change, step light state, beat cursor, and motif score update.
- Successful lock: cleaner harmony or voice layer, decoded phrase fragment, clarity boost, and restrained completion motion.
- Drift or overload: detune/noise, warning lamp, trace instability, and score pressure.

Progression can stay compact. A reviewable slice only needs one meaningful arc: calibrate carrier, discover or lock two or three motif fragments, and complete a final transmission score.

## Art, Audio, And Interaction Direction

The first screen should be the playable instrument panel, not a landing page. Preserve the repo's static-site shape unless implementation uncovers a stronger local build system.

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

## Real Asset Plan

Procedural rendering is allowed for live signal materials, but central visuals and audio must be intentional assets rather than throwaway primitives.

Runtime asset plan:

- Asset manifest or equivalent documentation listing procedural and authored runtime assets.
- Hardware panel texture produced through CSS/canvas or committed raster art: worn labels, screws, lamps, grained metal/plastic, and module separators.
- Patch cable assets as stateful canvas/SVG-style paths with route colors, endpoint sockets, glow, and disabled states.
- Scope/spectrum renderer driven by current game/audio state rather than decorative animation.
- Tape or buffer visual showing motif capture/playback position.
- Station typography and copy set: call signs, decoded fragments, motif names, score states, and warning states.
- Audio patch manifest: node graph, oscillator types, noise buffers, filter settings, delay settings, envelope timing, and mappings from player controls to sound.

If generated raster assets are created, keep contact sheets, prompts, checkpoints, or source notes in this Work Order directory, and copy optimized runtime assets into the public game path. If all assets are procedural, document why each procedural asset is final-intent art rather than a temporary placeholder.

## Character And Creature Art Plan

This concept does not need embodied characters, enemies, or bosses. The central "cast" is the hardware and signal system: source oscillator, noise field, sequencer, filter, tape buffer, and decoder.

Do not spend initial implementation budget on avatars, mascots, enemy sprites, or boss silhouettes. If a station persona is added later, it should be secondary flavor and must not replace the core playable instrument loop.

## Placeholder Retirement Checklist

Do not call the game review-worthy while any central placeholder remains:

- The preview entrypoint is a static studio catalog, marketing page, or unrelated homepage.
- The preview depends on remote shared-shell fetches that can fail under direct or file-based review.
- Audio is a single raw oscillator beep without sequencing, filtering, or musical identity.
- Visuals are decorative and disconnected from current synth/game state.
- Player actions change only sound or only visuals, instead of sound, motion, and state together.
- Controls are raw form widgets with no instrument-panel treatment or state feedback.
- There is no progression, score, clarity, discovery, motif unlock, or final transmission state.
- Browser audio unlock, mute/stop, and fallback states are unclear.
- Verification notes lack console/runtime results, interaction checks, and screenshots.

Acceptable final-intent procedural elements:

- State-driven waveform, spectrum, cable glow, meter fills, lamp flicker, and panel grain.
- CSS/canvas knobs and controls if they are polished, responsive, and accessible.
- Synthetic Web Audio patches if the musical system is structured, documented, and expressive.

## Engine, Asset Pipeline, Controls, And Verification Implications

Engine choice: keep the implementation static and dependency-light. A self-contained artifact under `drops/tb-123-signal-lab/` or `games/tb-123-signal-lab/` is the lowest-risk path for this repo. Existing studio pages can remain intact, with only minimal navigation/discovery links if needed.

Controls:

- Pointer/touch controls for knobs, sliders, patch/source selection, step toggles, and transport.
- Keyboard shortcuts only where they help: Space for start/stop or lock, `R` for reset, number keys for source/patch selection if implemented.
- Focusable controls, visible labels, sufficient contrast, stable hit targets, and reduced-motion behavior.
- No in-app wall of instructions; labels and immediate feedback should teach the loop.

Verification plan:

- Git status before editing and after implementation to identify unrelated changes.
- Static smoke: ensure the preview entrypoint is valid HTML and does not append links after a closed document.
- Browser smoke through local HTTP, plus direct-file behavior if FactoryX preview automation requires it.
- Regression check for the prior `studio-shell.js` `Failed to fetch` issue on the review entrypoint. Load the intended preview artifact and confirm the console does not include `https://ystackai.com/shared/studio-shell.js` or `Uncaught (in promise) TypeError: Failed to fetch`.
- File-preview regression check: reproduce the failing verification shape with a small local runtime-check HTML file or the FactoryX preview harness when available. If `file://` is intentionally unsupported, the preview notes must state the local HTTP command and explain why no remote shared-shell fetch path is involved.
- Interaction smoke: start audio, toggle a sequencer step, move at least one tuning/filter control, change one source/route, and observe score/clarity/state updates.
- Canvas or screenshot check: desktop and mobile screenshots show nonblank signal visuals and no text/control overlap.
- Audio behavior check: Web Audio initializes only after user gesture, mute/stop works, and parameter changes are ramped.
- Documentation: update this Work Order's `PREVIEW.md` and `VERIFICATION.md` with commands, outputs, screenshots or asset checkpoints, and known limitations.

## Guiding Tradeoffs

- A coherent playable loop beats broad but shallow feature coverage.
- Preserve existing static studio pages and the current `sacrificial-buffer` drop unless a small link is needed for discovery.
- Use authored or final-intent procedural assets before adding more modes.
- Make audio/visual coupling the product, not a decorative layer.
- Prefer direct reviewability over platform integration complexity.
- Treat verification as part of the release, especially browser audio unlock and preview loading behavior.

## What Not To Build

- No generic platformer, shooter, arena, or unrelated arcade game.
- No marketing landing page as the primary deliverable.
- No multiplayer, accounts, backend storage, leaderboards, or remote save service.
- No long intro before the player can manipulate sound.
- No central hero/enemy/boss art unless the concept changes to embodied characters.
- No stock-like imagery, decorative blobs, or visual effects disconnected from interaction state.
- No PR creation during this strategy gate.

## Public Progress Updates Worth Sharing

Share public progress only when it carries review-relevant evidence:

- Strategy gate complete on the canonical Work Order branch.
- First playable signal-lab loop is implemented with audio unlock, routing/tuning/sequencing, score/clarity progression, and state-driven visuals.
- Asset checkpoint documents hardware texture, patch cables/meters, signal renderers, and musical patch design.
- Verification checkpoint confirms no shared-shell fetch failure on the review entrypoint, plus desktop/mobile screenshots and audio-unlock behavior.
- PR-ready checkpoint summarizes implemented scope, controls, preview instructions, verification output, and known risks.

## PR Body Requirements For Implementation Phase

When implementation is ready, the PR body must include:

- FactoryX Work Order Context with the full supervisor prompt/request text.
- Summary of implemented scope and how it satisfies the creative-game brief.
- Direct preview path or URL and concise player controls.
- Art and asset manifest summary, including generated/authored/procedural asset decisions.
- Audio design summary: voices, filters/effects, sequencing, control mappings, and fallback behavior.
- Verification output with commands and results, including the prior fetch-failure regression.
- Screenshots or asset checkpoints when visuals materially affect review.
- Known limitations and remaining risks.
