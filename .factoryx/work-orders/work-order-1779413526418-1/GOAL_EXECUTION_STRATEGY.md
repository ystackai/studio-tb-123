# Goal Execution Strategy: TB-123 Synthesizer Signal Lab

Work Order: `work-order-1779413526418-1`  
Canonical branch: `factoryx/factory-tb-123/work-order`  
Target repo: `ystackai/studio-tb-123`  
Archetype: `creative_game`  
Planning gate status: strategy only; no production implementation changes yet.

## FactoryX Work Order Context

This strategy responds to the supervisor directive to build TB-123 as a synthesizer live music art/game experience, not a generic browser game slice. Durable Work Order planning, verification, preview notes, feedback, and worklog material should remain under `.factoryx/work-orders/work-order-1779413526418-1`.

The repository currently contains a static TB-123 studio site and an existing drop, `drops/sacrificial-buffer/index.html`, which is a minimal slider/audio toy. Preserve existing working pages, but do not treat the current drop as sufficient for this Work Order. The requested release needs a coherent first-screen music-making loop where audio is the primary material and visuals respond to every meaningful action.

Blocking prior-run issue to address before peripheral polish: browser runtime verification failed for a `file://` preview because `https://ystackai.com/shared/studio-shell.js` attempted a fetch and produced `Uncaught (in promise) TypeError: Failed to fetch`. Implementation must avoid relying on the shared Studio shell for the review entrypoint/runtime-check page. The preview artifact should be self-contained or served through a local HTTP server during verification, with a direct entry file that opens the playable experience rather than a remote-data studio catalog.

Planning-gate repo inspection on 2026-05-22 found no `WORKFLOW.md`, no existing open GitHub PR for `factoryx/factory-tb-123/work-order`, no current `PREVIEW.md` or `VERIFICATION.md` in this Work Order directory, and a dependency-light static site structure (`index.html`, `games/index.html`, `drops/`, `blog/`, `personas/`, `team/`). The implementation phase should keep that static-site shape unless new evidence shows a local build pipeline is already available.

Planning-gate update on 2026-05-22: `gh pr view` reported no pull request for the canonical branch, so there were no unresolved PR comments, review decisions, or check failures to triage beyond the supervisor-provided browser runtime failure. Treat that failure as blocking implementation feedback: the first implementation milestone must prove the preview entrypoint can load without the remote shared Studio shell fetch path before spending time on peripheral polish.

Strategy-gate refresh on 2026-05-22: `gh pr list --head factoryx/factory-tb-123/work-order` returned no open PR for the canonical branch, and the guarded source head for this planning pass was `36579fc901e03958d3a03b13d51d831dff5fe21a`. This document is the only planned artifact for the gate. Production implementation, preview rewiring, and PR creation are intentionally deferred until after strategy acceptance. The next coding pass should begin from the latest canonical branch head unless it advances, in which case fetch and rebase/merge forward before editing.

Implementation milestone order after the strategy gate:

1. Establish the self-contained review entrypoint and runtime-check path first, proving it does not load `https://ystackai.com/shared/studio-shell.js` and therefore cannot reproduce the prior `Failed to fetch` blocker.
2. Build the playable first-screen instrument loop: audio unlock, signal source, filter/tuning controls, step sequencing, patch state, and visible transmission objective.
3. Deepen audio/visual coupling: analyser-driven scope/spectrum, meters, cable states, motif unlocks, clarity/score pressure, and browser-audio fallback copy.
4. Wire the artifact into the static site only where needed for discovery, while keeping the direct Work Order preview path canonical for review.
5. Run and document verification in Work Order notes, then open or update the single canonical PR only after implementation is reviewable.

## Vision And Player Fantasy

The game should be **TB-123 Synthesizer Signal Lab**: a strange live electronic instrument disguised as a numbers-station recovery console. The player sits at warm failing hardware and turns interference into a coherent transmission by patching, tuning, sequencing, filtering, and sampling signal fragments.

The player fantasy is not "winning a generic arena." It is "I am operating unknown analog equipment, and my decisions make the signal become music." A reviewer should open the preview and immediately see controls that invite performance: patch nodes, step sequencer lanes, tuning/frequency knobs, filter controls, sample capture/hold actions, and a visible transmission objective.

Audience: reviewers and players who will evaluate the slice in a short browser session. They need to understand within seconds how to make sound, how their actions affect the signal art, and what progression means. The experience should be legible without a long tutorial, but it can feel mysterious through labels, call signs, signal fragments, and reactive instrumentation.

Admin/reviewer experience: the preview should load the instrument directly, with controls visible above the fold on desktop and mobile. A reviewer should be able to verify the loop in under two minutes: unlock audio, patch or select a route, edit a step or motif, tune/filter the signal, see the clarity/transmission objective react, and capture enough notes for review without reading external documentation first.

## Mood, World, References, And Emotional Target

Mood target: warm analog tension meeting cold signal analysis. The interface should feel like a battered field synthesizer, a shortwave station, and an oscilloscope bench sharing the same chassis.

Reference directions:

- Numbers stations and shortwave operation: call signs, coded phrases, carrier noise, tuning drift, station locks, and the satisfaction of isolating a buried signal.
- Classic modular synth workflow: patch cables, attenuators, filters, sequencer steps, envelopes, and meters that reveal current routing.
- Oscilloscope and spectrum analysis visuals: traces, Lissajous-style motion, spectral bands, VU meters, tape loops, and phase drift.
- Music games with performative feedback: progress should be felt through groove stability, motif unlocks, signal clarity, score/combo, and richer musical layers.

Evidence from the current repo supports a static, authored browser artifact rather than a bundled app rewrite: existing playable/drop surfaces are plain HTML documents, assets are committed directly, and there is no visible package/build configuration in the inspected file list. The strategy therefore favors self-contained Web Audio, canvas, and CSS over introducing a framework unless implementation uncovers a stronger local convention.

Emotional target: "The machine is unstable, but every correct patch and timing choice makes the noise cohere into a transmission I am performing."

## Core Interaction Loop And Progression

Primary loop:

1. Player starts audio with an explicit unlock gesture and immediately hears a muted carrier/noise bed with visible trace activity.
2. Player patches one of several signal sources into processing modules: oscillator, noise, sample buffer, filter, delay, envelope, or sequencer lane.
3. Player tunes frequency, filter cutoff, resonance, and sequence steps to align target signal bands or call-sign motifs.
4. Each successful alignment adds clarity, score, or transmission lock, while bad drift adds interference and destabilizes the loop.
5. Progression unlocks motifs, extra sequence lanes, cleaner signal layers, or a recording/final broadcast state.

Game-like arc:

- Start state: "unlock audio / calibrate carrier" with two or three obvious controls.
- Discovery: matching target frequencies reveals short motif fragments or call-sign syllables.
- Build: player records or locks motifs into an 8- or 16-step sequence, creating a coherent loop.
- Pressure: interference drifts, requiring retuning, filtering, or repatching to keep clarity high.
- Result: final transmission meter, performance score, unlocked motif list, and replay/re-record option.

Every meaningful action must affect both sound and visuals:

- Patch cable connect/disconnect: routing changes in audio graph, animated cable glow, module meter response.
- Knob or slider movement: parameter ramps in Web Audio, trace shape/frequency/spectrum changes.
- Sequencer step toggle: audible note/rest changes, step lights, beat cursor, motif score updates.
- Filter/sample action: timbre changes, spectral band compression/expansion, tape loop animation.
- Successful lock: harmony/melody layer unlocks, call sign becomes more intelligible, clarity meter rises.
- Drift or overload: detune/noise increases, trace destabilizes, warning lamp and score pressure respond.

## Art, Audio, And Interaction Direction

Visual identity should be a usable instrument panel, not a landing page. It can be built with HTML/CSS/canvas and procedural visuals, but the central experience must look deliberately authored: warm knobs, labeled modules, patch sockets, tape reels, waveform scopes, spectrum bands, hardware lamps, and station typography.

Intended screen layout:

- Main signal display: large oscilloscope/spectrum canvas that continuously reflects actual synth state.
- Module rack: compact controls for source, filter, sequencer, delay/sample buffer, and output.
- Patch bay: visually persistent routing with socket states and cable paths.
- Transmission objective: clarity/lock meter, active call sign, score/combo, unlocked motif indicators.
- Transport controls: start/stop audio, record/lock motif, reset, mute, and browser-audio state.

Musical identity:

- Base sound: shortwave carrier, filtered noise, slow tape flutter, and analog synth pulse.
- Voices: at least one bass/carrier oscillator, one melodic sequenced oscillator, one noise/sampling voice, and one percussive or envelope-shaped pulse.
- Processing: filter cutoff/resonance, delay/feedback, gain staging, panning or stereo movement where safe.
- Sequencing: a simple grid or step lane that produces recognizable rhythmic/melodic change.
- Progression cues: successful tuning adds harmony or cleaner melody; overload introduces noise and instability.

Browser audio behavior:

- Audio must start only after a clear user gesture.
- Before unlock, controls should still move visuals but show audio locked state.
- After unlock, scheduled/ramped Web Audio changes should avoid clicks.
- Include mute/stop behavior and cleanup on restart.

## Real Asset Plan

Procedural signal rendering is appropriate for scopes, meters, patch cables, and spectrum movement because the game is about live audio state. However, central UI surfaces and musical identity should not feel like placeholder primitives. Implementation should create a runtime asset manifest, even if most assets are generated in code, documenting each material and sound patch.

Planned runtime assets and treatments:

- Hardware panel texture: authored CSS/canvas texture or lightweight raster with warm metal/plastic noise, screw points, worn labels, and scanline grime.
- Patch cable visuals: canvas or SVG-style paths with color-coded routes, glow states, and endpoint sockets.
- Scope/spectrum renderer: canvas traces driven by analyser nodes and current sequencer/tuning state.
- Tape/sample buffer visual: reel or loop strip animation showing captured motifs and playback position.
- Module controls: styled knobs, sliders, switches, step buttons, and lamps with stable dimensions.
- Call-sign typography: station labels, decoded phrase snippets, motif names, and result readout.
- Audio patches: documented Web Audio node graph with oscillator types, envelopes, filters, delay, noise buffer, sequencer timing, and parameter mappings.

If AI-generated or raster assets are added later, keep source/contact sheets or checkpoints under this Work Order directory and copy optimized runtime files into the public game path. If no external images are used, the asset manifest must explicitly state which visual assets are procedural and how they are generated.

## Character And Creature Art Plan

This experience does not require embodied characters, enemies, or creatures. The "characters" are the modules and station voices: source oscillator, noise field, tape buffer, filter, sequencer, and transmission decoder. Do not spend implementation budget on avatars, enemies, mascot sprites, or boss silhouettes unless the core music instrument is already complete and verified.

If the implementation adds a station persona or visual operator later, keep it secondary to the instrument. The first reviewable artifact should succeed through playable sound, signal art, and progress feedback.

## Placeholder Retirement Checklist

Do not call the game review-worthy while these central placeholders remain:

- A static landing page or studio catalog is the preview entrypoint instead of the instrument/game.
- User actions only change visuals or only change sound; every meaningful action must affect both.
- Audio is limited to one raw oscillator beep with no musical design, sequencing, filtering, or state mapping.
- Scope/spectrum visuals are decorative animations disconnected from current synth/routing state.
- Controls are generic form widgets with no hardware/signals-lab treatment or route state.
- There is no progression, scoring, motif unlock, recording, transmission lock, or performance objective.
- Browser audio unlock/fallback behavior is unclear.
- Runtime preview depends on remote shared shell fetches that can fail under `file://` verification.
- No verification notes show desktop/mobile runtime, console status, and audio-unlock behavior.

Acceptable temporary elements:

- Procedural waveform traces, particles, glow, and meter fills if they are state-driven and documented.
- CSS-only knobs/cables/panels if they are visually coherent, responsive, and not raw unstyled controls.
- Synthetic Web Audio patches if they are musically structured and documented as the actual audio design.

## Engine, Asset Pipeline, Controls, And Verification Implications

Engine choice: keep the project static and dependency-light unless implementation inspection reveals an existing build system. A self-contained browser artifact under `drops/tb-123-signal-lab/` or `games/tb-123-signal-lab/` is the lowest-risk path. The review preview root should open the artifact directly or redirect with a small valid HTML page. Do not append links after closed HTML documents.

Implementation should avoid shared-shell runtime dependencies for the playable artifact. Existing studio pages can keep their current remote shell usage, but the Work Order preview and browser verification target should be able to load without fetching Studio data from `ystackai.com`.

Controls:

- Primary: pointer/touch interactions for knobs, patch sockets, step toggles, and transport buttons.
- Keyboard: Space for start/stop or lock, number keys for quick patch/source selection if implemented, `R` for reset.
- Accessibility: focusable controls, visible labels, enough contrast, stable button sizes, no text overlap on mobile.
- Motion: honor `prefers-reduced-motion` by reducing shake, flicker, and rapid background drift.

Verification plan:

- Static inspection: verify no production change touches unrelated studio content except necessary navigation/preview links.
- Browser smoke: load the artifact through local HTTP and, if needed, direct file path; assert no console errors.
- Regression for prior issue: verify the preview entrypoint does not throw `Failed to fetch` from `studio-shell.js`, especially for any `file://` runtime-check artifact used by FactoryX automation.
- Interaction smoke: unlock audio via user gesture, toggle a sequence step, move at least one knob, change one patch route, and confirm visible state changes.
- Canvas/signal check: screenshot or pixel check confirms nonblank scope/spectrum output and active meter states.
- Audio behavior check: document that Web Audio initializes only after gesture, nodes are created, mute works, and parameter changes are scheduled/ramped.
- Responsive check: capture desktop and mobile screenshots showing the playable first screen and controls without overlap.
- Documentation: update `.factoryx/work-orders/work-order-1779413526418-1/PREVIEW.md` and `VERIFICATION.md` during implementation with commands, output, and known limitations.

## Guiding Tradeoffs

- Music-making clarity beats broad game features. One strong instrument/game loop is better than several shallow modes.
- Preserve the TB-123 studio site and existing drops unless a link must expose the new artifact.
- Favor self-contained static files over framework migration.
- Use Web Audio deliberately rather than adding external audio dependencies unless the repo already supports them cleanly.
- Make the first screen playable; do not hide the core loop behind a hero, long intro, or explanatory page.
- Polish the audio/visual coupling before secondary lore, menus, or cosmetic flourishes.
- Treat browser runtime verification as part of product design because audio unlock and `file://` behavior directly affect reviewability.

## What Not To Build

- No generic arcade arena, platformer, shooter, or unrelated game slice.
- No marketing landing page as the primary deliverable.
- No remote service dependency for the playable review entrypoint.
- No multiplayer, accounts, leaderboards, backend storage, or external save service.
- No long narrative intro before the player can manipulate sound.
- No central reliance on stock-like imagery, decorative gradients, or visual effects that are disconnected from audio state.
- No raw oscillator-only "beep toy" without sequencing, filtering, routing, and documented musical identity.

## Public Progress Updates Worth Sharing

Share concise updates only when they provide review-relevant evidence:

- Strategy gate complete on the canonical Work Order branch.
- First playable signal-lab loop exists with audio unlock, routing, tuning, sequencing, visual trace response, and a progress objective.
- Audio design checkpoint documents synth voices, filters/effects, sequencing rules, and fallback behavior.
- Verification checkpoint confirms local browser runtime, no `studio-shell.js` fetch failure on the review entrypoint, desktop/mobile screenshots, and audio unlock behavior.
- PR-ready checkpoint summarizes implemented scope, controls, verification output, preview instructions, and known limitations.

## PR Body Requirements For Implementation Phase

When implementation is ready for review, the PR body must include:

- FactoryX Work Order Context with the full supervisor prompt/request text.
- Summary of implemented scope and how it satisfies the synthesizer signal lab brief.
- Controls and player loop instructions.
- Audio design: synth voices, filters/effects, sequencing rules, interaction mapping, and browser-audio unlock/fallback behavior.
- Visual feedback mapping for each meaningful musical action.
- Verification output with commands and results, including the targeted runtime fetch-failure regression.
- Preview instructions and direct artifact path/URL.
- Known browser/audio limitations and any follow-up work.
