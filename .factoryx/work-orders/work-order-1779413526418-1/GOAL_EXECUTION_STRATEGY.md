# Goal Execution Strategy: Continuous Work Order TB-123

Work Order: `work-order-1779413526418-1`  
Canonical branch: `factoryx/factory-tb-123/work-order`  
Target repo: `ystackai/studio-tb-123`  
Archetype: `creative_game`  
Planning gate status: strategy only; no production implementation changes yet.

## FactoryX Context

Automation selected this Factory because no active model lease or pending Work Order was found. The requested release should create a small browser game slice with scoring, progression, or discovery. The experience must give the player feedback for meaningful actions through motion, state, and deliberate sound or music direction.

No previous playtest feedback files were present under `.factoryx/work-orders/*/FEEDBACK.md` at planning time. The repo currently contains a static studio site and an existing drop, `The Sacrificial Buffer`, that behaves more like an abstract audio toy than a reviewable game slice. The implementation should preserve working studio pages while using the new Work Order to ship a coherent playable artifact.

## Vision And Player Fantasy

The release should become a compact 2D browser game called **Sacrificial Buffer: Core Run** or a closely related title. The player is a signal courier defending an overloaded memory buffer long enough to stabilize corrupted data fragments. The fantasy is quick, legible, and musical: move, collect stable packets, deflect corruption, cash in a streak, and survive a short escalation arc.

The first screen should immediately present the playable game, not a marketing page or static shell. A reviewer should understand the loop within seconds: move the courier, collect bright packets, avoid or cleanse corruption, build score multipliers, and reach a visible stabilization threshold.

Audience: web reviewers and casual browser-game players who will judge the work in one short session. The game should be approachable without a tutorial page, but the HUD and motion language must explain what is happening through state, animation, and concise labels.

## Mood, World, References, And Emotional Target

Mood target: tense but readable arcade pressure, with a clean cybernetic signal-lab identity. The world should feel like an instrument panel under stress rather than a generic neon void.

Reference directions:

- **Geometry Wars / arcade arena clarity:** readable player silhouette, pickups, hazards, score bursts, and escalating density.
- **Rez / musical feedback language:** user actions should sound intentional and rhythm-aware, with layered cues instead of unrelated beeps.
- **Into the Breach style information honesty:** hazards, danger zones, and progression states must be visible before they punish the player.
- **Data-center / synth module materials:** gridded panels, scanlines, patch traces, and buffer lanes can provide texture without burying gameplay.

Emotional target: "I am barely keeping the signal alive, and every good move makes the system sound and look healthier."

## Core Interaction Loop And Progression

Primary loop:

1. Move the courier around a fixed arena using keyboard and pointer-friendly controls.
2. Collect stable packets to raise score and buffer charge.
3. Avoid corrupted shards or spend charge to pulse/cleanse nearby corruption.
4. Chain clean pickups to build a multiplier and short music-layer intensification.
5. Survive waves until a stabilization meter fills, then trigger a short win state or boss-like surge.

Progression inside the slice:

- Minute-zero: low hazard count, clear pickup collection, score feedback.
- Mid-run: corruption paths become more active, packet values and streaks matter.
- End surge: a larger readable boss/sentinel or central corruption core appears for a short finale, forcing use of the pulse/cleanse mechanic.
- Result state: score, best streak, stabilization outcome, restart action.

Every meaningful action should produce at least two feedback channels:

- Movement: animation lean, trail, or engine pulse.
- Pickup: score pop, buffer meter gain, musical note or chord layer.
- Damage: screen shake constrained by reduced-motion preference, HUD warning, low-frequency hit cue.
- Cleanse/pulse: radial motion, enemy state change, intentional percussive or filtered sound cue.
- Progression/win/loss: scene state, music transition, and clear result copy.

## Art Direction

Visual identity should use authored or generated raster assets plus CSS/canvas compositing where appropriate. The player, hazards, pickups, and finale entity must be intentional silhouettes, not throwaway circles, rectangles, or vector blobs.

Intended visual treatment:

- Player courier: compact readable sprite with a bright core, directional thruster frames, and a distinct shield/pulse silhouette.
- Stable packets: small but detailed shards or data capsules with consistent pickup glow.
- Corruption enemies: angular hostile silhouettes with damaged texture, not generic red balls.
- Finale/boss: large central sentinel or corruption core with readable weak/active states.
- Background: layered arena texture with buffer lanes, data traces, and subtle parallax or scan movement.
- UI: dense arcade HUD with score, multiplier, buffer charge, wave/stabilization meter, and best result. Keep text compact and ensure it fits on mobile.

Accessibility implications:

- Respect `prefers-reduced-motion` by reducing shake, flashes, and intense background movement.
- Keep color contrast high and avoid relying on color alone for danger; hazards need shapes and motion patterns.
- Provide a mute/music toggle and a visible audio unlock state because browser audio requires user interaction.

## Audio And Music Direction

The audio identity should move beyond oscillator-only beeps. Browser-native Web Audio synthesis is acceptable if it is composed as a real soundtrack direction with layers, envelopes, filters, and scheduled musical cues. If generated audio files are feasible during implementation, prefer short loop/stem assets and decode-check them.

Music target:

- Tempo: tense mid-tempo electronic pulse around 112-126 BPM.
- Layers: ambient bed, bass pulse, pickup arpeggio, danger layer, cleanse percussion, finale intensifier.
- Game state mapping: score streaks add musical brightness; damage ducks or filters the mix; low buffer introduces a warning layer; win/loss has distinct cadences.

Sound cue target:

- Pickup: pitched, short, musical, varied by streak.
- Pulse/cleanse: soft attack plus percussive body, not a raw click.
- Damage: filtered impact with quick recovery.
- Wave/finale: riser or low sweep.

## Real Asset Plan

The implementation should create an asset manifest under the Work Order or game directory that names every authored/generated image and audio asset used in the game. If assets are generated, retain contact sheets or checkpoint images under `.factoryx/work-orders/work-order-1779413526418-1` and copy optimized runtime assets into the public game path.

Planned runtime assets:

- `player_idle`, `player_move`, `player_pulse`, `player_damage`: sprite frames or a compact sprite sheet.
- `packet_stable`: pickup sprite with glow/active variants.
- `enemy_corruption_small`, `enemy_corruption_fast`, `enemy_corruption_heavy`: enemy silhouettes with idle/damaged variants when feasible.
- `boss_core_idle`, `boss_core_active`, `boss_core_break`: finale silhouette or animated frames.
- `arena_background`, `arena_lane_overlay`, `arena_warning_overlay`: texture layers.
- `ui_meter_frame`, `ui_charge_fill`, `ui_warning_icon`: small UI treatments if CSS alone is not enough.
- Audio: `music_loop_main`, `music_layer_danger`, `sfx_pickup`, `sfx_pulse`, `sfx_hit`, `sfx_wave`, `sfx_result`, or equivalent synthesized patches documented in the manifest.

Asset verification checkpoints:

- Decode/render check for every image asset.
- Audio unlock and decode check for audio files, or deterministic initialization check for Web Audio patches.
- Desktop and mobile screenshots showing real assets in-game, not just in a gallery.
- Asset manifest reviewed against placeholder retirement checklist before PR.

## Character And Creature Art Plan

The game has embodied characters/entities, so central silhouettes need a clear plan:

- Player courier contact sheet: 4-8 thumbnail poses exploring core shape, shield ring, thruster direction, and damage state. Select one direction before producing runtime frames.
- Player frames: idle, move/boost, pulse, hit, and disabled/loss state if the scope permits.
- Enemy silhouettes: at least three hostile forms, visually distinct by behavior. Small chaser should read narrow and fast; heavy hazard should read broad and slow; finale core should dominate the center or edge of the arena.
- Boss/finale poses: dormant, active, vulnerable/break, and defeated/stabilized state.
- Portraits are optional; in-game readability takes priority over character portrait work.

## Placeholder Retirement Checklist

Do not call the game review-worthy while these central placeholders remain:

- Generic circle player: replace with authored/generated courier sprite or clearly intentional silhouette frames.
- Generic red/black hazard balls: replace with corruption enemy silhouettes and at least one behavior-linked visual variant.
- Plain rectangle arena/background: replace with texture, lane overlays, and signal-panel details that support readability.
- Oscillator-only one-off beeps: replace with composed Web Audio patches or decoded audio stems that establish musical identity.
- Static score-only HUD: replace with score, multiplier, buffer charge, wave/stabilization state, and result feedback.
- No asset manifest: add one that identifies source, runtime path, dimensions/duration, and intended use.

Temporary procedural particles, trails, score pops, and meter fills may remain if they support the real assets and are documented as effects rather than central stand-ins.

## Engine, Pipeline, Controls, And Verification

Engine choice: keep the project static and dependency-light unless inspection reveals an existing build system. A self-contained HTML/CSS/JS canvas game under `drops/` or `games/` is likely the lowest-risk path for this repo. Use structured JavaScript modules only if the existing hosting path supports them cleanly.

Controls:

- Keyboard: WASD/arrow movement, Space or Enter for pulse/cleanse, R for restart if visible in UI.
- Pointer/touch: drag or virtual steering region; tap pulse button if needed.
- UI controls: mute/music toggle, pause/restart, reduced-motion compatibility.

Pipeline:

- Keep durable planning and checkpoints under `.factoryx/work-orders/work-order-1779413526418-1`.
- Put runtime game files in a previewable public path and ensure the preview root opens the artifact directly or through a valid redirect page.
- Maintain an asset manifest that maps Work Order checkpoints to runtime files.
- Avoid appending content after closed HTML documents.

Verification:

- Static smoke check: load game HTML and verify no console errors.
- Canvas/gameplay check: use Playwright or an equivalent browser script to confirm the canvas is nonblank, first screen is playable, movement changes state, scoring increments, audio unlock UI behaves, and restart works.
- Screenshot checkpoints: desktop and mobile first-play state, active gameplay with score/meter, result or finale state.
- Asset checks: image dimensions/decode, audio decode or Web Audio initialization, manifest completeness.
- If no package tooling exists, add narrowly scoped verification scripts only where they reduce review risk.

## Guiding Tradeoffs

- Prioritize a complete, legible loop over breadth of levels.
- Prefer a short polished arena run over a larger unfinished campaign.
- Keep implementation compatible with static hosting.
- Invest in player/enemy/background/audio identity before secondary menus or lore.
- Preserve existing studio pages and drops; changes should be additive unless a link needs to point reviewers to the new artifact.
- Use generated assets only when they can be integrated, verified, and documented; unused asset experiments should stay out of runtime paths.

## What Not To Build

- No landing-page-only release.
- No unreviewable prototype hidden behind unclear instructions.
- No large framework migration unless the current repo unexpectedly requires one.
- No multiplayer, account state, leaderboards, backend storage, or external service dependency.
- No long narrative intro before play.
- No central characters, enemies, or music identity made only from temporary primitive shapes and raw beeps.

## Public Progress Updates Worth Sharing

Share updates when they provide review-relevant evidence:

- Strategy approved and implementation begins on the canonical Work Order branch.
- First playable loop exists with score, buffer, and restart.
- Real asset checkpoint: player/enemy/background/music direction integrated in-game.
- Verification checkpoint: desktop/mobile screenshots and browser smoke test pass.
- PR-ready checkpoint: brief, implementation notes, verification output, preview instructions, and known risks are in the PR body.

## PR Body Requirements For Implementation Phase

When implementation is ready for review, the PR body must include:

- FactoryX Work Order Context with the full prompt/request text.
- Summary of implemented scope and how it satisfies the creative brief.
- Asset pipeline and manifest summary, including generated/authored assets.
- Verification output with commands and results.
- Preview instructions and direct artifact path/URL if available.
- Remaining risks, limitations, and any known follow-up work.

