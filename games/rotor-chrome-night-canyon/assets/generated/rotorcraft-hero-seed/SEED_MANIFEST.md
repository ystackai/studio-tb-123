# Rotor Chrome Hero Recovery Seed

This directory is a precompiled recovery input for the adaptive creative loop.
It is not evidence that the deployed game improved: the GLB still has to be
integrated into the exact served artifact and reassessed there.

## Purpose

The previous production intervention asked the worker to author a large
Blender generator. It accumulated 629 lines before its first syntax check,
failed with an indentation error, deleted the generator, and produced no
durable source, export, render, or browser evidence. This seed removes that
failure mode. The next intervention should execute and integrate this known
good input, not rewrite it from scratch.

## Durable Files

- Source generator: `../../source/build_rotorcraft_hero.py`
- Blender source: `rotorcraft_hero_source.blend`
- Runtime export: `rotorcraft_hero.glb`
- Review evidence: four named PNG views and `rotorcraft_contact_sheet.png`
- Deployed reviewer result: `vision-review.json`

## Reproduction

Run from `games/rotor-chrome-night-canyon`:

```sh
set -e
python3 -m py_compile assets/source/build_rotorcraft_hero.py
rm -rf /tmp/rotorcraft-hero-check
blender -b --python assets/source/build_rotorcraft_hero.py -- \
  --out /tmp/rotorcraft-hero-check
test -s /tmp/rotorcraft-hero-check/rotorcraft_hero.glb
test -s /tmp/rotorcraft-hero-check/rotorcraft_contact_sheet.png
test -s /tmp/rotorcraft-hero-check/rotorcraft_hero_source.blend
```

Do not trust Blender's process status by itself. Blender 5.1 returned status 0
for two Python tracebacks during seed development. The output checks and the
`ROTORCRAFT_HERO_READY=` marker are mandatory.

## Compatibility And Visual Gate

- Generated successfully with local Blender 5.1.2.
- Generated successfully inside the deployed TB-123 worker with Blender 3.4.1.
- Exact Blender 3.4 contact sheet passed deployed `factoryx replay-critic`.
- Reviewer model: `qwen3-vl:8b`.
- Reviewer scores: R1 graphics 5, R2 audio 2, R3 fun/engagement 5, R4 unique style 5.
- Canvas variance: 2550.5794691932556.

R2 is not an asset defect: this contact sheet intentionally contains no audio.
The integrated experience must separately preserve and verify its real music
file and SFX files.

## Checksums

- Generator SHA-256: `c98f00cd1fdf79ff993e783a7c16851646933e8841386cc233fbc13ea62e43e2`
- GLB SHA-256: `f8e4cc9218963a3d87bea63f18479ce6686d2b7303f1e9f91afd786d1b3d16bd`
- BLEND SHA-256: `979f5c58847a318d6450f9372b0597ac3761890ee4df93e84506b96f3b84bfb3`
- Contact sheet SHA-256: `be0200eb1379ceb49125e37f82d3539d401c39daf6355fc75bea5ef8bb16c5f5`

## Integration Boundary

Load `rotorcraft_hero.glb` as the visible player craft, retain the procedural
craft only as a temporary load fallback, and locate the exported `MainRotor`
and `TailRotor` nodes for animation. Frame the model large enough to read from
the active chase camera. The integration pass must rerun the installed vision
reviewer, verify the GLB returns HTTP 200 in the exact preview, preserve the
existing gates, stems, music, SFX, payoff, and relaunch, and capture active-play
evidence before claiming improvement.
