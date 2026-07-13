# Asset Manifest — Numbers Station Bloom

## Runtime Assets (dist/)
| File | Size | Description |
|------|------|-------------|
| `dist/index.html` | ~12KB | Single-file game: Canvas 2D rendering, Web Audio, full game logic |

## Evidence Assets
| File | Description |
|------|-------------|
| `factoryx-evidence/.../PLAYTEST.json` | Schema v1 play trace with 8 events, 11 screenshots |

## Screenshots
| File | Content |
|------|---------|
| `title.png` | Title screen with game instructions |
| `active-start.png` | First signal after pressing Enter |
| `active-signal1.png` | Color signal in play, 3 options shown |
| `active-signal2.png` | Second signal decoded |
| `active-signal3.png` | Garden growing with 3 plants |
| `active-escalation.png` | Pitch signal (waveform visual) |
| `active-signal5.png` | Mid-game with more plants |
| `active-late.png` | Late-round fast-paced signal |
| `result-screen.png` | Failure outcome with partial garden |
| `restart-title.png` | Title screen after restart |
| `run2-result.png` | Second run outcome |

## External Dependencies
None. The game is entirely self-contained in `dist/index.html`.

## First Checkpoint Contract

- Do not reread boilerplate WORKLOG.md, PREVIEW.md, or VERIFICATION.md before making progress.
- Read FEEDBACK.md only if it contains non-boilerplate reviewer feedback.
- Within the first six shell commands, create one durable checkpoint: a script patch, a planned-ID/dry-run artifact, a generated asset file, or a blocker with exact missing prerequisite.
- When Requested IDs are already listed below, use them as the startup source of truth; before searching old assets broadly, append planned source/export/render evidence paths for those IDs to this manifest or create an executable generator/list-mode patch.
- For copied asset scripts, first prove the main spec list and output paths contain every requested ID and no stale IDs, then render.

