# Rotor Chrome Night Canyon Living Plan

This is an append-only intervention plan, not a one-way creative-stage list.
Completed tickets remain historical facts. After each pass, assess the whole
artifact in `CREATIVE_STATE.md` and append one uniquely named intervention for
the most important current deficit. A later pass may revisit any concern.

```yaml
tickets:
  - id: rotor-craft-asset-kit-and-first-flight
    title: Recover a technically complete first flight
    goal: >
      Establish a durable playable Rotor Chrome slice with a steerable craft,
      radar gates, collectible musical stems, an earned ending, real file-based
      audio, active Foundry assets, browser evidence, and a canonical PR.
    scope: >
      This is the recovered baseline. Its successful Work Order proves runtime
      integrity and a playable loop, not final creative quality.
    depends_on: []

  - id: assets-pass-02-hero-craft-and-canyon-stage
    title: Give Rotor Chrome an authored visual identity
    goal: >
      Starting from the accepted Rotor Chrome first-flight implementation,
      replace the central procedural visual identity with a coherent exported
      asset kit. Build and integrate a readable tiny stealth rotorcraft with a
      strong side and rear silhouette, authored canyon formations and signal
      architecture, and a mirrored-hangar reveal that visibly transforms the
      frame. Keep the existing working gate, pickup, stem, ending, and relaunch
      behavior. Discover the live Asset Foundry recipes first and preserve job
      provenance. The current catalog has no rotorcraft or canyon recipe, so do
      not pretend a mismatched sonar, submarine, bunny, or samurai output is the
      requested hero art. Use Foundry output where it genuinely shapes the
      experience, and create documented Blender source plus exported GLB assets
      for brief-specific gaps. In-code primitives may support collision and
      atmosphere but may not remain the visible hero craft, primary canyon
      language, or final hangar payoff.
    scope: >
      Treat authored_assets as the selected intervention. Change controls or
      audio only where required to integrate and present the new kit. Use a
      full-bleed chase composition with a larger off-center craft, layered
      canyon depth, cool near-white key/rim light, and material color rather
      than saturated colored lights. Reject dashboard, generic neon grid,
      pad-board, abstract instrument, and asset-files-loaded-but-visually-unused
      outcomes.
    verify: >
      Commit source and exported visual assets plus updated provenance. Browser
      verification must show zero console/page/request/HTTP errors, real GLB
      responses, music and at least three SFX loaded from files, input changing
      flight state, an earned ending, and clean relaunch. Capture stable close
      hero, active-flight, pickup/stem transformation, and mirrored-hangar
      screenshots. In the active-flight capture the rotorcraft must be large
      enough to judge its silhouette and materials; authored world assets must
      visibly carry foreground, midground, and background; and the result must
      no longer read as rings inside dark procedural walls.
    depends_on: [rotor-craft-asset-kit-and-first-flight]

  - id: tb-123-rotor-chrome-night-canyon--assets-pass-02-create-one-new-bright-authored-rotorcraf
    title: Recover one durable, vision-gated Rotor Chrome hero
    goal: >
      Create one new bright authored rotorcraft from scratch. Do not attempt to
      salvage the prior replacement: work-order-1783641517957-7-2 produced a
      blank dark contact sheet and its uncommitted Blender source and GLB did
      not survive the worker restart. Build a single readable stealth
      rotorcraft with a distinctive chrome silhouette, cockpit/body structure,
      rotor and propulsion details, and materials that remain legible against
      the midnight canyon. Preserve the baseline's working flight, gates,
      pickups, real music, SFX, payoff, and relaunch behavior.
    scope: >
      This is one bounded authored_assets intervention from creative snapshot
      tb-123-rotor-chrome-night-canyon:production:c4822b3:recovery-source-missing-v2.
      Produce one hero, not a batch and not a broad canyon or hangar rewrite.
      Keep the Blender source, exported GLB, render views, contact sheet,
      reviewer report, provenance, and integration changes in git before
      expanding the pass. Supporting primitives may remain for collision and
      atmosphere, but they may not substitute for the visible hero.
    verify: >
      Render a bright, tightly framed contact sheet and immediately run the
      installed runtime vision reviewer. A blank, dark, cropped, primitive, or
      unreadable result fails the gate and must be repaired or committed as
      explicit failure evidence; file existence and Blender exit zero are not
      approval. After a passing asset review, integrate the GLB and capture the
      exact served experience in active flight with the craft large enough to
      judge. Prove zero browser/page/request errors, input changing flight
      state, real music and at least three SFX still active, payoff reachable,
      relaunch clean, and every source/export/render/report/manifest file
      committed and pushed on the canonical Work Order branch.
    depends_on: [rotor-craft-asset-kit-and-first-flight]

done: false
```
