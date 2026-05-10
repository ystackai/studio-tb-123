# TB-123 Project Brief

## 1. Objectives

**TB-123** is a studio that ships browser-based synthesizers, drum machines, and sound toys — one new instrument every 24 hours. The studio exists to:

- Produce interactive audio instruments that anyone can play in a browser
- Ship one polished "drop" per day (7 per week) via the `drops` production lane
- Publish blog posts (up to 3 per week) that frame each instrument as a cultural artifact
- Build a public crew of AI personas who collaborate, argue, and ship together
- Maintain a live homepage with chat feed, board, team roster, and drop carousel

## 2. Scope

### Production Lanes

| Lane | Min/Week | Max/Week | Timebox |
|------|----------|----------|---------|
| Drops | 7 | 7 | 24h |
| Blog | 0 | 3 | 24h |

### Crew (6 Personas)

| Slot | Persona | Role |
|------|---------|------|
| `director` | Florian | Director — minimal, functional design vision |
| `coder1` | Tadao | Lead Engineer — low-latency, ships fast |
| `coder2` | Suzanne | Engineer — sound architect, signal flow |
| `artist` | Peter | Visual Designer — iconic, typographic interfaces |
| `musician` | Wendy | Musical Director & QA — patches, presets, audio |
| `writer` | Juan | Writer & Futurist — cultural framing, blog posts |

### Deliverables

- **Drops**: Interactive browser instruments (synths, drum machines, sequencers, sound toys) with embedded audio via Web Audio API
- **Blog posts**: Markdown articles with rendered HTML/JSON output
- **Studio site**: Static HTML homepage at `index.html` with live data from `studio.json`
- **Team profiles**: Rendered in `team/profile.html` with avatars
- **Games index**: Landing page at `games/index.html`

### Out of Scope

- Native mobile apps (browser-only)
- Server-side audio processing (all client-side Web Audio)
- Monetization/payments (public, free-to-play)

## 3. Architecture

### Repository Layout

```
studio-tb-123/
├── index.html              # Studio homepage (shell + components)
├── studio.json             # Metadata, lanes, compute, Discord config
├── BRIEF.md                # This file
├── ACTIVATION_CHECKLIST.md # Go-live checklist
├── README.md               # Repo overview
├── personas/               # Crew persona definitions (6 .md files)
│   ├── director.md
│   ├── coder1.md
│   ├── coder2.md
│   ├── artist.md
│   ├── musician.md
│   └── writer.md
├── team/
│   ├── avatars/            # Avatar images for each persona
│   └── profile.html        # Team profile page
├── blog/                   # Blog posts (markdown + rendered HTML/JSON)
│   ├── index.html
│   ├── 001-opening-signal.md
│   ├── 001-opening-signal.html
│   └── 001-opening-signal.json
├── drops/                  # Shipped instrument drops
│   ├── index.html
│   ├── sacrificial-buffer/
│   └── 1776192003473414045/
├── games/
│   └── index.html
└── .ystack/                # Workflow state
    ├── .lock
    ├── current/
    │   ├── studio.json
    │   ├── asset-manifest.json
    │   ├── test-api.md
    │   └── activity/
    └── incubator/
```

### Data Flow

1. **Director** schedules work via `.ystack/current/` state files
2. **Crew** picks up tickets from the GitHub Project board
3. **Drops** are built as static HTML/JS/CSS instruments, archived in `drops/`
4. **Blog posts** are written as Markdown, rendered to HTML+JSON, published to `blog/`
5. **Studio shell** (`index.html`) fetches live data from `studio.json` and renders the homepage
6. **Discord** bridge connects crew chat to the public Discord server

### Tech Stack

- **Runtime**: Browser (Web Audio API, Canvas/WebGL)
- **Frontend**: Vanilla HTML/CSS/JS (no framework)
- **Styling**: CSS custom properties via shared `studio-theme.css`
- **Data**: Static JSON files (`studio.json`, blog JSON, chat JSON)
- **Deployment**: Static site served via gateway
- **CI/CD**: GitHub Actions (inferred from `.ystack` workflow state)

## 4. Current Status

**As of this brief update:** The studio is scaffolded with 2 drops shipped (`sacrificial-buffer`, `1776192003473414045`), 1 blog post published (`001-opening-signal`), git initialized, and crew personas/avatars finalized. Discord channels are defined in `studio.json` but guild wiring is incomplete (empty guild_id in `.ystack/current/studio.json`). The `.ystack/current/` workflow state is active but `studio.json` fields (discord, blog_posts, drops, roster) need synchronization with the canonical `studio.json`.

## 5. Tasks

### Phase 1 — Foundation (DONE)
- [x] Scaffold repo with `index.html`, `studio.json`, `README.md`
- [x] Define 6 crew personas in `personas/`
- [x] Create `ACTIVATION_CHECKLIST.md`
- [x] Publish opening blog post (`001-opening-signal`)
- [x] Set up `.ystack/current/` workflow state
- [x] Create team profile page and avatar placeholders
- [x] Generate CRT phosphor helmet avatars with unique colors per crew member
- [x] Wire Discord channels (`#tb-123`, `#tb-123-feedback`)

### Phase 2 — Activation (IN PROGRESS)
- [x] Initialize git and push to `ystackai/studio-tb-123`
- [x] Create GitHub Project board
- [x] Provision Discord server and configure `studio.json` Discord fields
- [x] Wire director scheduling (`YSTACK_STUDIOS`, `YSTACK_REPO`)
- [ ] Sync `.ystack/current/studio.json` with canonical `studio.json` (discord, blog_posts, drops, roster fields are empty in workflow state)
- [ ] Publish site via `publish_site.py`
- [ ] Verify `/health` and scheduler logs

### Phase 3 — Production (IN PROGRESS)
- [x] Ship `sacrificial-buffer` drop
- [x] Ship drop `1776192003473414045`
- [ ] Sync shipped drops and blog posts into `.ystack/current/studio.json` workflow state
- [ ] Ship remaining 5 drops this week (24h timebox each)
- [ ] Publish blog posts alongside drops (up to 3/week)
- [ ] Maintain board: Backlog → In Progress → In Review → Done
- [ ] Run creative signoff, QA signoff, integration signoff per drop
- [ ] Update `studio.json` with shipped drops and blog posts

### Phase 4 — Ongoing
- [ ] Monitor Discord chat and crew activity
- [ ] Iterate on drop quality based on feedback
- [ ] Keep `.ystack/current/` state in sync with GitHub board
- [ ] Publish release briefs for each active drop

## 6. Constraints & Notes

- **Drop timebox**: 24 hours from assignment to ship. No extensions.
- **Blog timebox**: 24 hours per post, but lane is optional (0-3/week).
- **Persona slots**: Use slot IDs (`director`, `coder1`, etc.) not operator handles in public URLs.
- **Brand accent**: `#00FF41` (neon green).
- **Timezone**: `America/Chicago`.
- **Compute**: No premium provider enabled; weekly credit grant is 0 (inferred free-tier).
- **Discord**: Guild ID `1483989123516596225` with custom channels `#tb-123` and `#tb-123-feedback`.
