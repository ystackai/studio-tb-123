# Goal Execution Strategy: 24h 3D Open City Dance Battle Game

Work Order: `work-order-1779673571313-176`  
Implementation Work Order: `24h 3D Open City Dance Battle Game`  
Canonical branch: `factoryx/factory-tb-123/work-order`  
Target repo: `ystackai/studio-tb-123`  
Archetype: `creative_game_3d`  
Strategy gate date: 2026-05-25  
Planning protocol: strategy only. Do not implement production changes, open a PR, or request human review from this gate.

## FactoryX Work Order Context

This document is the durable strategy artifact for the manual Work Order requesting a GTA-style 3D open-world browser game with dance battles. Keep all durable planning, feedback, preview notes, verification notes, worklog updates, asset checkpoints, and review-prep material for this pass under `.factoryx/work-orders/work-order-1779673571313-176`.

The concrete brief asks for a browser-native 3D city exploration game where the player walks around and resolves encounters through dance battles (rhythm/dance moves) instead of combat. The 24-hour timebox runs until `2026-05-26T01:44:31Z`. The completion mode is `polish_until_deadline`.

Planning-gate inspection refreshed on 2026-05-25 for the current `/goal` request:

- Workspace: `/workspaces/factory-tb-123/worker-1/ystackai_studio-tb-123/checkout`.
- Current branch: `factoryx/factory-tb-123/work-order`.
- Guarded source head for this gate: `c7919219bde098484ab82141d8acb0a82299b7ed` (`c791921 Refresh strategy for current work order prompt`).
- `gh pr view` reported no pull requests found for branch `factoryx/factory-tb-123/work-order`, so there is no open PR to update, no review decision to triage, and no PR checks/comments available during this planning gate.
- `WORKFLOW.md` exists and specifies `npm test` as the after-run hook, though this repo has no `package.json` or npm setup.
- The repo is a dependency-light static site with no existing 3D game infrastructure. It uses single-file HTML pages and external theme/stylesheets.
- Factory context lists available crew agents: `signal-director`, `interface-coder`, `systems-reviewer`, and `copy-writer`.
- No `PREVIEW.md`, `VERIFICATION.md`, `FEEDBACK.md`, or `WORKLOG.md` exist yet for this Work Order.
- No prior strategy exists for work-order-1779673571313-176.

This strategy file is the only intended artifact for the planning gate. Production implementation, generated/runtime assets, preview rewiring, verification evidence, and PR creation are deferred until after this gate is accepted.

## Blocking Feedback To Address First

The most important technical consideration for this Work Order:

1. **No existing 3D infrastructure.** The repo has no Three.js, no build tooling, no `package.json`. The implementation must bootstrap Three.js (via CDN) into a single-page game entrypoint.
2. **Preview path must open the game directly.** Per the workflow guidelines, the review preview root should open the game artifact itself — not redirect through the Factory homepage. A new page at `games/dance-battle/index.html` (or similar) is the cleanest approach.
3. **No remote fetch dependencies for runtime stability.** All game logic, assets, and styles should be self-contained. Three.js loaded via CDN is acceptable; external asset URLs (textures, models, sounds) should be procedurally generated or embedded as Data URIs / procedural Web Audio to avoid `Failed to fetch` errors.
4. **Browser runtime verification is critical.** The prior work order's `studio-shell.js` fetch failure is a pattern to avoid. The dance-battle entrypoint must load and start without console errors.

## Vision And Player Fantasy

Recommended direction: **"Beat District"** — a compact, GTA-inspired 3D city where the player walks around freely and resolves every encounter through dance battles.

**The experience:**

- The player character (a stylized blocky figure) walks through a neon-lit city grid at night with glowing streetlights, simple building silhouettes, and a starry skybox.
- NPC dance-battle targets roam or stand in designated "battle zones" (marked by neon circles on the ground).
- Approaching an NPC triggers a dance battle: the NPC plays a rhythm pattern of colored arrows/key cues, and the player repeats them. Correct timing earns score; the more the player chains, the better their rating.
- Winning a dance battle unlocks new city districts, NPC challengers, and visual flair (neon effects, music tracks). Losing resets but doesn't punish — the game is exploratory and forgiving.
- **No fighting, weapons, damage, or combat loops anywhere.** Conflict resolution is exclusively dance battles.

**Art direction:**
- Low-poly, voxel-inspired aesthetic: simple box geometries with colorful emissive materials for a neon-noir city vibe.
- City layout: grid of streets with 3–4 blocks of buildings, some parks with trees, and a central plaza as the starting area.
- NPCs are simple humanoid shapes with color-coded auras to show their dance rank/strength.
- UI overlay: minimal HUD with a score bar, a mini-map, and a "challenge" prompt when near an NPC.
- Dance battle UI: a rhythm lane with falling colored key indicators (like DDR/Beatmap), with timing windows for Perfect/Good/Miss.

## Goal And Success Criteria

### Must-have (Definition of Done)

1. **Reviewer can open a browser preview and walk around a 3D city.**
   - WASD movement, mouse-look (pointer lock) for camera control.
   - Player can navigate through streets, around buildings, and into multiple areas.
   - Buildings, streets, lighting, and spatial depth are all visible and navigable.

2. **Reviewer can trigger and complete at least one dance battle against an NPC.**
   - Walking near an NPC triggers a challenge prompt.
   - Activating the prompt starts a dance battle rhythm mini-game.
   - At least one complete rhythm sequence (4–8 steps) is playable with scoring feedback.
   - Win/loss outcome is displayed with clear feedback.

3. **The experience has no fighting/combat mechanics.**
   - No health bars, no weapons, no damage.
   - All encounters are dance battles.

4. **PR body documents context, scope, verification output, preview instructions, screenshots, and known limitations.**

5. **Repo verification path is run and regressions are fixed or clearly documented.**

### Nice-to-have (polish during 24h budget)

- Multiple NPC types with increasing difficulty.
- Multiple city districts/neighborhoods with different visual themes.
- Score tracking and unlock progression (new areas open at score thresholds).
- Background music generated via Web Audio (no external audio files).
- Mini-map overlay showing player position and nearby NPCs.
- Day/night visual toggle for visual variety.

## User/Admin Experience

### Player Experience

| Phase | What the player does |
|-------|---------------------|
| **Start** | Opens the game page; a "Click to Start" overlay with controls appears. |
| **Roam** | Walks the city with WASD, looks around with the mouse. Notices NPCs standing near dance spots. |
| **Challenge** | Presses an interact key (E) near an NPC → dance battle UI appears. |
| **Dance** | Follows rhythm cues (arrow/key presses) in time with the beat. Receives Perfect/Good/Miss feedback. |
| **Result** | Screen flashes win/lose; score updates; NPCs react (victory dance or defeat animation). |
| **Loop** | Player roams to new areas, challenges new NPCs, builds score, unlocks districts. |

### Controls

| Key | Action |
|-----|--------|
| `W` / `↑` | Move forward |
| `S` / `↓` | Move backward |
| `A` / `←` | Strafe left |
| `D` / `→` | Strafe right |
| `Mouse` | Look around (pointer lock) |
| `E` | Challenge nearby NPC / interact |
| `1-4` / `↑↓←→` | Dance rhythm input (during battles) |
| `Esc` | Release pointer / pause |
| `Shift` | Sprint (while walking) |

## Key Constraints And Tradeoffs

| Constraint | Tradeoff |
|-----------|----------|
| **No external asset files** (textures, models, sounds) | All visuals are procedural geometry + materials. All audio is Web Audio API synthesis. This keeps the game self-contained and avoids fetch failures. |
| **Browser-only, no build tools** | Single HTML file (or a small set) with inline JS/CSS. Three.js via CDN. No Webpack/Vite — simpler to review and preview. |
| **24-hour timebox** | Prioritize one solid, complete dance battle loop over many shallow features. A polished single encounter beats five broken ones. |
| **Open world vs. performance** | Keep the city manageable (3-4 blocks, ~20 buildings) with simple box geometry. Use instanced rendering for repeated elements (streetlights, trees). |
| **No combat** | Dance battles replace all encounters. No health, no weapons, no damage — just rhythm scoring. |
| **Preview accessibility** | The game must load and be playable from a static file preview or minimal local server. No auth, no API calls, no external dependencies beyond Three.js CDN. |

## Evidence And References

- **Three.js** (https://threejs.org/) — the de-facto standard for browser 3D. Used via CDN import maps for zero-build setup.
- **Pointer Lock API** (https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API) — standard for mouse-look FPS/TPS camera control.
- **Web Audio API** (https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) — for procedural music and SFX. Used for NPC "beat" patterns and dance cues.
- **DDR/Beatmap rhythm game patterns** — falling arrow lanes with timing windows (Perfect ~50ms, Good ~100ms, Miss >100ms).
- **Low-poly / voxel aesthetics** — inspired by games like *Superhot*, *Chrome Snake*, and *Monaco* for visual clarity with simple geometry.

## Technical Shape And Verification Implications

### Architecture

```
games/dance-battle/
  index.html          ← Game entrypoint (preview root)
  /js
    main.js           ← Bootstraps Three.js, game loop, scene setup
    player.js         ← Player character, movement, camera, pointer lock
    city.js           ← Procedural city generation (buildings, streets, lighting)
    npc.js            ← NPC spawning, positioning, dance battle triggers
    dance-battle.js   ← Rhythm mini-game engine, input handling, scoring
    audio.js          ← Web Audio synthesis: background beats, SFX, victory/loss sounds
    ui.js             ← HUD, dance battle UI, menus, progress overlay
```

### Key Technical Decisions

- **Three.js via CDN import map** — no npm, no build step. `import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.163.0/build/three.module.js';`
- **Single HTML entrypoint** at `games/dance-battle/index.html` — serves as the preview root and is self-contained.
- **Procedural city** — buildings are `BoxGeometry` with random heights/colors, streets are flat planes with grid-aligned roads.
- **Player character** — composite of simple box geometries (body, head, arms, legs) with basic animation from movement state.
- **NPCs** — simple humanoid figures with colored emissive rings underneath to indicate dance spots.
- **Dance battle system** — a 2D overlay on top of the 3D scene: colored key indicators fall down lanes; player presses matching keys in rhythm.
- **Camera** — third-person chase camera behind the player with mouse-look via Pointer Lock API.
- **Collision detection** — simple AABB box collision for walls/buildings; distance-based NPC triggering.

### Verification Strategy

1. **Preview verification**: Open `games/dance-battle/index.html` in a browser. Verify the city renders, the player can move, and a dance battle can be triggered and completed.
2. **Console smoke**: Open DevTools → Console tab. Confirm zero `console.error` and zero `Uncaught` errors on load.
3. **Rhythm interaction smoke**: Walk to an NPC, trigger a battle, complete at least one sequence. Verify scoring feedback appears correctly.
4. **No-combat check**: Inspect all game logic — confirm no `damage`, `health`, `weapon`, or combat-related code exists.
5. **Performance check**: Monitor frame rate in browser DevTools. Target: stable 30+ FPS on typical laptop.
6. **Preview path**: The `games/dance-battle/index.html` file serves as the preview root per FactoryX preview guidelines.

## Non-Goals

- No multiplayer or networking — single player only.
- No 3D models, textures, or audio files from external sources.
- No physics engine (no ragdolls, vehicle physics, etc.).
- No complex NPC AI — NPCs have simple patrol or idle behaviors.
- No save/load system or persistent progress (session-scoped score only).
- No mobile touch controls (keyboard + mouse only).
- No VR, AR, or advanced visual effects (shaders, post-processing).
- No social features, leaderboards, or accounts.

## Implementation Milestone Order

Given the 24-hour budget and the `polish_until_deadline` completion mode, the implementation follows this order:

1. **Foundation (hours 0–4)**: Bootstrap Three.js scene, implement player movement with WASD + mouse look, add basic city geometry (streets, buildings). Get the player walking in a 3D space.
2. **NPCs and battles (hours 4–10)**: Add NPC characters to the city, implement proximity-based challenge triggering, build the dance battle rhythm mini-game with keyboard input and scoring.
3. **Audio and polish (hours 10–16)**: Implement Web Audio background beats, dance SFX, victory/loss sounds. Add HUD, mini-map, UI overlays. Polish player/NPC animations.
4. **Progression and districts (hours 16–20)**: Add district unlocking based on score thresholds. Add visual variety across districts (different building palettes, lighting colors).
5. **Verification and PR (hours 20–23)**: Run full verification smoke tests, capture screenshots, write PR body with FactoryX context, open the canonical PR.
6. **Final polish (hours 23–24)**: Address any runtime issues, fix regressions, tighten controls, polish visuals until the deadline hits or a real blocker prevents further progress.

## Guiding Tradeoffs

- **One great dance battle beats five mediocre ones.** Focus on making one encounter deeply satisfying before adding variety.
- **Procedural > asset-hungry.** All visuals and audio are generated in-code. No external files to fetch or fail.
- **Playable > perfect.** A rough-but-functional city with one working dance battle is better than a beautifully-rendered empty city.
- **Preserve existing site.** Don't modify `index.html`, `drops/`, or other existing pages unless a small link is added to the game from the games page.
- **Verification is part of the release.** Runtime smoke tests, console inspection, and screenshot capture are not afterthoughts — they're milestones.
- **Keep diffs reviewable.** Each implementation step should be a coherent, product-shaped change that can be reviewed on its own.

## Public Progress Updates Worth Sharing

Share public progress only when it carries review-relevant evidence:

- Strategy gate complete on the canonical Work Order branch.
- Foundation milestone: Three.js city with player movement is playable.
- Dance battle milestone: First working dance battle with scoring and feedback.
- Audio milestone: Procedural Web Audio background beats and SFX.
- Polish milestone: Multiple districts, visual effects, UI polish.
- Verification milestone: Console-clean, preview working, screenshots captured.
- PR-ready milestone: Canonical PR opened with full FactoryX context, verification output, and preview instructions.

## PR Body Requirements For Implementation Phase

When implementation is ready, the PR body must include:

- **FactoryX Work Order Context** with the full supervisor prompt/request text.
- **Summary of implemented scope** and how it satisfies the creative-game-3d brief.
- **Direct preview path** (e.g., `games/dance-battle/index.html`) and concise player controls.
- **Visual and audio design summary**: procedural city aesthetic, Web Audio beats, dance battle mechanics.
- **Verification output** with commands and results, including console inspection and dance-battle completion.
- **Screenshots** of the city, a dance battle, and the victory screen.
- **Remaining risks and known limitations** (e.g., single-district initial release, no mobile support).
