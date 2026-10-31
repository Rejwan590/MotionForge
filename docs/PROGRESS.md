# MotionForge Development Progress

## Phase 1: UI Shell, Upload, Scoring, Storyboard (Status: COMPLETE)
- Monorepo initialized: `@motionforge/core`, `@motionforge/mcp`, `@motionforge/server`, `@motionforge/web`.
- 7 styles from Playbook & Selector Guide implemented and tested (`score.test.ts` passed 6/6).
- Fastify server daemon running on `127.0.0.1:4100` with WebSocket support.
- FFmpeg thumbnail and metadata extraction verified.
- Storyboard schema, approval, and live WebSocket sync verified.
- Visual QA match verified against `reference/ui-reference.png` at 1536×1024.

---

## Phase 2: Asset Prep, Voice, Captions, Sound (Status: COMPLETE)

### 1. Asset Prep Engine (`apps/server/src/prep.ts`)
- **Trim Clip**: Exact sub-clip extraction (`-ss`, `-t`, `-c:v libx264 -c:a aac`) saving to `prep/<base>_trim_<start>s_<dur>s.mp4`.
- **Crop Clip**: 16:9 (`crop=iw:iw*9/16`), 9:16 (`crop=ih*9/16:ih`), and 1:1 (`crop=min(iw,ih):min(iw,ih)`) saving to `prep/<base>_crop_<aspect>.mp4`.
- **Constant Frame Rate (30 fps CFR)**: `-r 30 -fps_mode cfr -c:v libx264 -crf 20` to prevent drift during code placement and browser rendering.
- **Audio Extraction**: Extracts audio tracks to 48kHz stereo WAV in `audio/<base>_audio.wav`.
- **Loudness Normalization**: EBU R128 loudness normalization to -16 LUFS (`loudnorm=I=-16:TP=-1.5:LRA=11`).
- **Preview Proxies**: Generates lightweight 540p fast drafts for instant browser scrubbing.
- *Strict Sandbox Rule*: Originals in `assets/` are never modified; all processed copies are saved to `prep/` or `audio/`.

### 2. Voice Generation (`apps/server/src/voice.ts`)
- Kokoro-82M on-device TTS with 7 character profiles (`af_heart`, `af_nova`, `af_sky`, `am_adam`, `am_michael`, `bf_emma`, `bm_george`) and Neural Edge-TTS fallback.
- Voice narration output saved to `audio/voice.wav`.
- Verified audio duration and waveform playback in the web UI.

### 3. Whisper Captions (`apps/server/src/captions.ts`)
- Word-level timestamp generation using `faster-whisper` and Parakeet.
- Outputs dual files:
  - `audio/captions.json` (word-level start/end timestamps and confidence scores)
  - `audio/captions.srt` (standard SRT cue sidecar)
- Verified word timestamps align with narration audio.

### 4. Sound FX & Dual Mix Engine (`apps/server/src/sound.ts`)
- **SFX Whoosh**: Synthesized dynamic frequency-swept white noise (`audio/whoosh.wav`).
- **SFX Impact**: Sub-bass 808 drop and punch (`audio/impact.wav`).
- **Dual Mix with Ducking**:
  - `audio/with-voice.wav`: Voice narration + background music ducked by -12dB + SFX, normalized to -16 LUFS.
  - `audio/music-fx-only.wav`: Music + SFX at full levels (no voice), normalized to -16 LUFS.
  - Verified with FFmpeg `ebur128` filter.

### 5. Interactive UI Workspace (`apps/web/src/components/Phase2Workspace.tsx`)
- Full Phase 2 workspace unlocked on Step 3 ("Assets & Voice") with dedicated tool controls, job log stream, voice profile auditioning, word-level caption bubble inspector, and dual mix audio players.
- Visual screenshot captured with Playwright at 1536×1024 (`qa/phase2_current.png`).

---

## Phase 3: Agent Bridge, Full MCP Suite & Final Render (Status: COMPLETE)

### 1. Agent Bridge & Interactive CLI Dock (`apps/web/src/components/BottomDock.tsx`)
- Three-tab dock:
  - **Agent Bridge**: Real-time agent status, active MCP tools indicator, project context.
  - **Antigravity CLI**: Live terminal execution with interactive slash commands (`/status`, `/prep`, `/voice`, `/mix`, `/preview`).
  - **Project Folder**: Dynamic file explorer showing `brief.md`, `assets/`, `prep/`, `audio/`, `scenes/`, `out/`, with file sizes, sync status, and relative paths.
- Real-time updates via WebSocket (`ws://127.0.0.1:4100/ws`).

### 2. Comprehensive MCP Server Suite (`packages/mcp/src/index.ts`)
- Model Context Protocol server exposing tools over stdio:
  - `list_assets`: Inspects uploaded footage, audio, images.
  - `get_brief`: Reads `brief.md` and `AGENTS.md`.
  - `score_styles`: Evaluates Q1-Q5 scoring matrix and elimination rules.
  - `get_storyboard`: Retrieves active `storyboard.json`.
  - `save_storyboard`: Saves updated scenes to disk with Zod validation.
  - `prep_clip`: Runs ffmpeg clip operations (trim, crop, cfr, proxy) safely.
  - `generate_voice`: Synthesizes speech with Kokoro or Edge-TTS.
  - `transcribe`: Word-level transcription via faster-whisper.
  - `build_mix`: Ducked dual mix generation.
  - `lint_project`: Verifies composition timing and scene validity.
  - `render_preview`: Low-res draft preview.
  - `render_final`: Multiplexes full-resolution MP4.
  - `get_job_status`: Tracks background task queue progress.

### 3. HyperFrames Scene Generator & Final Render (`apps/server/src/render.ts`)
- Synthesizes `brief.md`, `AGENTS.md`, and code-generated scenes (`scenes/scene_01.html`, `scene_02.html`, etc.).
- Multiplexes 1080p 30fps CFR video with dual audio mix into `out/render.mp4`.
- Validated with EBU R128 loudness check (-16.0 LUFS).

---

## Phase 4: Multi-Track Timeline Editor & OpenReel Integration (Status: COMPLETE)

### 1. OpenReel Due Diligence & Spike (`vendor/openreel-video`)
- Shallow cloned `https://github.com/Augani/openreel-video.git` into `vendor/openreel-video`.
- Verified MIT License, Copyright (c) 2024-2026 Augustus Otu and Contributors.
- Documented findings in `docs/OPENREEL.md` and third-party notices in `THIRD_PARTY_NOTICES.md`.
- Completed all 5 Spike verifications:
  - a. Local compilation of `@openreel/core` models and timeline actions.
  - b. Local file path mapping through MotionForge HTTP Server Asset Bridge (`/api/projects/:slug/files/:path`).
  - c. Code-generated project loading mapping `storyboard.json` + `audio/captions.json` into OpenReel schema.
  - d. Export capabilities: Dual path architecture using high-performance Canvas for interactive browser preview and native Gyan.FFmpeg 9.0.2 for full 1080p CFR master renders.
  - e. Standalone integration: Clean native timeline editor matching `design/tokens.css` without heavy upstream bundling overhead.

### 2. Timeline Adapter Package (`packages/timeline-adapter`)
- Zod schemas matching OpenReel `Project`, `Timeline`, `Track`, `Clip`, `Transition`, and `Subtitle`.
- Bidirectional converter:
  - `storyboardToTimeline(input)` -> OpenReel Project JSON (`timeline/project.json`).
  - `timelineToStoryboard(project)` -> Storyboard JSON.
- Timeline operations:
  - `addClip`, `trimClip`, `moveClip`, `addTransition`, `addOverlay`, `addCaptionTrack`, `setAudioLevels`, `recalculateDuration`.
- Comprehensive unit test suite: 5/5 unit tests passing.

### 3. Server Timeline Endpoints (`apps/server/src/timeline.ts`)
- `GET /api/projects/:slug/timeline`
- `POST /api/projects/:slug/timeline/from-storyboard`
- `PUT /api/projects/:slug/timeline`
- `POST /api/projects/:slug/timeline/add-clip`
- `POST /api/projects/:slug/timeline/trim-clip`
- `POST /api/projects/:slug/timeline/move-clip`
- `POST /api/projects/:slug/timeline/add-transition`
- `POST /api/projects/:slug/timeline/add-overlay`
- `POST /api/projects/:slug/timeline/add-caption-track`
- `POST /api/projects/:slug/timeline/set-audio-levels`
- `POST /api/projects/:slug/timeline/export` (renders `out/timeline-export.mp4`)

### 4. Agent MCP Timeline Suite (`packages/mcp/src/index.ts`)
- 9 new timeline MCP tools:
  - `get_timeline`, `add_clip`, `trim_clip`, `move_clip`, `add_transition`, `add_overlay`, `add_caption_track`, `set_audio_levels`, `export_timeline`.
- Verified live round-trip: MCP calls modify `timeline/project.json`, persist on disk, broadcast over WebSocket, and export cleanly.

### 5. Desktop-Class Web UI: Edit & Render Steps
- **Stepper**: 5 distinct steps:
  1. Upload & Score
  2. Storyboard
  3. Assets & Voice
  4. Edit
  5. Render
- **Timeline Editor (`apps/web/src/components/TimelineEditor.tsx`)**:
  - Top toolbar: "Open from Storyboard", "Add Overlay", "Export Timeline MP4".
  - Left panel: Media Pool & Scenes list.
  - Center panel: Video preview player with timecode, play/pause transport, zoom controls.
  - Right panel: Clip inspector with in/out trim points, duration, volume slider.
  - Multi-track timeline:
    - Track 1: Overlays & B-Roll
    - Track 2: Main Video (scenes 1, 2, 3...) with transition badges
    - Track 3: Captions / Subtitles with word timing
    - Track 4: Voiceover (Dialogue)
    - Track 5: Music & Sound FX with ducked levels
- **Render Workspace (`apps/web/src/components/RenderWorkspace.tsx`)**:
  - Aspect ratio selector (16:9 Landscape, 9:16 Shorts, 1:1 Square).
  - Resolution selector (1080p Full HD, 4K Ultra, 720p Draft).
  - Live render progress, CFR 30fps transcode, loudness verification (-16.0 LUFS), and download link.

### 6. Visual QA
- Playwright captured screenshots at 1536×1024:
  - `qa/edit_step.png`: Step 4 Edit (Multi-track timeline editor) adhering to `design/tokens.css`.
  - `qa/render_step.png`: Step 5 Render (HyperFrames final render studio).
