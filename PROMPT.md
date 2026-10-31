# MotionForge master prompt (paste this into the Antigravity agent)

You are building **MotionForge**, a local desktop-class web app that turns a user's own footage, photos, music and script
into finished explainer videos, using code-generated motion graphics and an AI agent. Everything runs on the user's machine.

## 0. Read first (do this before writing code)
- `reference/ui-reference.png` : the exact interface to reproduce.
- `design/DESIGN.md` and `design/tokens.css` : region-by-region UI spec and design tokens.
- `.agent/skills/motionforge-ui/SKILL.md` : UI rules and the mandatory screenshot-compare loop.
- If the two PDFs exist in `docs/` (The Code-Video Playbook, Style Selector Guide), read them; their logic is the product spec.
  If they are missing, use section 3 and 4 below, which summarise them.
- Installed skills: run `npx skills add heygen-com/hyperframes`. Read each installed SKILL.md before using that tool.
- Do not assume any CLI flag. Run `--help` for ffmpeg, whisper, hyperframes and the Antigravity CLI and record what you find in `docs/TOOLS.md`.

## 1. Product in one paragraph
The user creates a project, uploads assets (video, photos, audio, logos, script, optional data CSV), answers a few questions
(goal, length, platform, voice mode). The app scores the seven video styles with the selector rules, shows the pick and runner-up,
generates a storyboard (one beat per idea, with a still per beat), waits for approval, preps assets, generates voice and captions,
has an agent build the scenes as code, previews, and renders MP4. A built-in terminal runs the Antigravity CLI, and the app also
exposes its own tools over MCP so the Antigravity agent can drive it. A multi-track timeline editor (the open-source openreel-video, integrated in Phase 4) lets the user cut, trim, add transitions, overlays and captions.

## 2. Architecture
- Monorepo: `apps/web` (Vite + React + TypeScript + Tailwind), `apps/server` (Node 22, TypeScript, Fastify, @fastify/websocket,
  chokidar, zod), `packages/mcp` (MCP server using `@modelcontextprotocol/sdk`), `packages/core` (shared types, style scoring, storyboard schema).
- Projects live on disk in `~/MotionForge/projects/<slug>/` with: `brief.md`, `assets/`, `prep/`, `audio/`, `storyboard.json`, `style.json`,
  `scenes/` (the generated video code), `out/render.mp4`. The folder is the source of truth; the UI reflects it. Never edit originals in `assets/`;
  write prepped copies to `prep/`.
- Server owns a job queue (one render at a time, others queued) and streams events to the web app over WebSocket
  (job progress, file changes, terminal output, health).
- Worker commands run as child processes with timeouts and captured logs: ffmpeg/ffprobe, whisper or faster-whisper, TTS (Kokoro first,
  Piper and Edge TTS as options), and `npx hyperframes` (init, lint, preview, render). Default video framework is HyperFrames; keep a
  `framework` setting so Remotion or Revideo can be added later.
- Security: bind to 127.0.0.1 only, random per-session token for API and WebSocket, path sandbox to the projects folder, reject `..`,
  never run shell strings (use argument arrays), size and type limits on uploads.

## 3. The seven styles (data in `packages/core/styles.ts`)
Codes: K Kinetic Type, C Chalk Talk, T Clean Tech, W Software Walkthrough, D Data Story, M Warm Canvas, P Pop Info.
Each style record: id, name, look description, build notes, best framework, needs footage, voice fit, sound palette, best length, avoid-when.
Fill these from the Code-Video Playbook section 7 and Style Selector Guide section 7. Each style also gets a code-rendered preview tile.

## 4. Style scoring (`packages/core/score.ts`, unit-tested)
Implement the Style Selector Guide exactly:
- Q1 main thing on screen, Q2 desired outcome, Q3 tone, Q4 length/platform, Q5 audience: each answer adds the listed points to K,C,T,W,D,M,P.
- Hard rules after scoring: no footage of the user removes M; no screen or app removes W (or warns); no data removes D; under 15 seconds removes C.
- Result: leader by 4 or more is primary; top two within 3 points pick the one matching Q1 and suggest one borrowed element; three tied asks for a clearer goal.
- Return a ranked list with a one-line reason and an "avoid" warning per style. Also allow the user to override the pick.
- Optional auto-fill: an "Analyze my media" button that inspects uploads (ffprobe, file types, whether a face or screen is present) and pre-answers Q1.
- Test with the three worked examples from the guide (expected winners: Kinetic Type, Software Walkthrough, Warm Canvas).

## 5. Pipeline and phases
Build in this order (Phases 1 to 4; Phase 5 is optional). Do not start a phase until the previous one passes its acceptance checks.

### Phase 1: UI shell, upload, scoring, storyboard
- Reproduce the full layout from the reference (all regions, with live state where possible, mock data only behind a clearly labelled dev flag).
- Upload with drag and drop, progress, FFmpeg thumbnails, ffprobe metadata (duration, size, resolution, fps), remove file.
- Style questionnaire (modal or panel) -> scoring -> style tiles show the pick and runner-up.
- Storyboard: the agent (or, as a fallback, a deterministic template) creates `storyboard.json`: ordered scenes with id, title, start, end,
  description, media refs, style, and a still-frame image. User can edit text, reorder, add and delete scenes, and must click Approve before Phase 2.
- Acceptance: scoring tests pass; uploading three files produces thumbnails and metadata; approving writes `storyboard.json`; screenshot QA matches the reference.

### Phase 2: asset prep, voice, captions, sound
- Prep tools: trim, crop to 9:16 or 16:9, constant frame rate (30 fps), extract audio, loudness normalise (about -16 LUFS), proxies for preview.
- Voice: modes "My voice", "AI voice" (Kokoro default, Piper, Edge TTS), "No voice". Voice picker with sample playback.
- Captions: transcribe the final voice track with Whisper to word-level timestamps, saved as `audio/captions.json` and `.srt`.
- Sound: generate whoosh and impact effects with ffmpeg, accept user music, duck music under voice, produce two mixes: `with-voice.wav` and `music-fx-only.wav`.
- Acceptance: each tool has a button, a job log, and a result file; mix loudness verified with ffmpeg; captions line up with the voice within one frame.

### Phase 3: agent bridge, build, preview, render
- **CLI terminal panel**: spawn the Antigravity CLI as a child process through a pty (`node-pty`) in the project folder and stream it to an xterm.js
  terminal in the dock. Command name and arguments are configurable in Settings with an auto-detect and a "Test" button. Show a clear error if not found.
- **MCP server** (`packages/mcp`, stdio and local HTTP): expose tools `list_assets`, `get_brief`, `score_styles`, `get_storyboard`, `save_storyboard`,
  `prep_clip`, `generate_voice`, `transcribe`, `build_mix`, `lint_project`, `render_preview`, `render_final`, `get_job_status`.
  Each tool validates input with zod, is sandboxed to the active project, and returns structured JSON.
- Settings page shows the exact `mcp_config.json` snippet to paste into Antigravity (`~/.gemini/antigravity/mcp_config.json`) and a "Copy config" button.
  Do not edit the user's config file automatically; ask first.
- Build step: write `brief.md` (goal, style, length, voice mode, asset list, storyboard) and a project `AGENTS.md` telling the agent to follow the installed
  HyperFrames skills, use only files in the project, and never modify `assets/`. The agent then writes the scenes into `scenes/`.
- Preview: run `npx hyperframes preview` (or the chosen framework) and embed it in the Preview card; "Generate Preview" re-renders a low-res draft.
- Render: queue final MP4 at the chosen aspect ratio and resolution; for the voice mode setting, render both audio versions if requested; verify duration and loudness; save to `out/`.
- Acceptance: the terminal opens a live Antigravity session; Antigravity can call `list_assets` and `render_preview` through MCP; a full test project goes from upload to MP4.

### Phase 4: Timeline Editor (mix MotionForge with openreel-video)
Goal: the user can cut, trim, add transitions, overlays, captions and music on a real multi-track timeline, using the open-source editor
`github.com/Augani/openreel-video` (reported to be MIT licensed), while code-built motion graphics still come from HyperFrames.

**Step 0: due diligence and spike (do this first, then STOP and report before forking anything)**
1. Clone openreel-video into `vendor/openreel-video` (shallow clone). Read its LICENSE, README, package layout and dependency licences.
   Write `docs/OPENREEL.md` with: licence text summary, how to run it, which packages exist (core engine, shared UI, AI agent tools),
   the project/timeline file format, import and export capabilities, browser and desktop limits. Do not assume anything not in the repo.
2. Spike, with pass/fail and notes for each:
   a. runs locally from the vendored copy;
   b. imports video, image and audio files from a local path;
   c. loads a timeline/project that was generated by code (not clicked together), so MotionForge can write the storyboard into it;
   d. exports a project and reports resolution, fps, audio and quality, including alpha/transparency if overlays need it;
   e. its core engine can be used from the MotionForge server or web app without the full upstream UI.
3. If b, c or d fail, stop and give me options (adapter, small upstream patch, or a simpler built-in timeline). Do not hack around a failure silently.
4. Keep `LICENSE` and copyright notices intact, add a `THIRD_PARTY_NOTICES.md`, and check dependency licences for anything that blocks use.

**Architecture after the spike passes**
- Pipeline: HyperFrames renders each code-built scene (kinetic text, charts, mockups, chalk, cartoon) to a clip in `out/scenes/`.
  openreel-video is the timeline where those clips, the user's own footage, captions, voice and music are arranged and finished.
  Never run two competing render paths for the same scene. Code scenes -> HyperFrames. Editing and assembly -> timeline. Final export path is chosen
  from the spike results and recorded in `docs/OPENREEL.md`.
- Create `packages/timeline-adapter` (TypeScript, zod-validated) that converts both ways:
  `storyboard.json` + `assets/` + `audio/captions.json` + `audio/*.wav` + `out/scenes/*.mp4`  <->  the openreel project format.
  The project folder stays the source of truth: the timeline is saved as `timeline/project.json` and every edit is written back to disk.
- Keep changes to the vendored editor minimal and isolated (patch files or a thin wrapper package) so upstream updates remain possible.
- Embed the editor in the web app as a new "Edit" step, styled with `design/tokens.css` to match the rest of MotionForge (theme overrides only; no rewrite).
  The stepper becomes: Upload & Score, Storyboard, Assets & Voice, Edit, Render.
- "Open in timeline" builds the timeline automatically from the approved storyboard: one clip per scene on the video track, captions on a caption track,
  voice and music on audio tracks, overlays on upper tracks. The user then edits freely.
- Round trip with the agent: add MCP tools `get_timeline`, `add_clip`, `trim_clip`, `move_clip`, `add_transition`, `add_overlay`, `add_caption_track`,
  `set_audio_levels`, `export_timeline`. They read and write `timeline/project.json`, validate with zod, and are sandboxed to the active project.
  Changes made by the agent appear live in the editor, and the user's manual edits are visible to the agent.
- Never modify `assets/` originals. The editor works on prepped copies in `prep/` or references originals read-only.

**Acceptance for Phase 4**
- Starting from an approved storyboard, "Open in timeline" produces a correct multi-track timeline with no manual import.
- The user can trim a clip, add a transition and an overlay, edit a caption, then export; the file matches the timeline.
- An Antigravity agent call to `add_overlay` through MCP shows up in the editor and survives a reload.
- Licence notices are present and `docs/OPENREEL.md` lists the spike results.
- Screenshot QA: the Edit step uses MotionForge's tokens and matches the surrounding UI.

### Phase 5 (optional, later): CapCut draft export
Only after Phase 4 works. Add an isolated best-effort "Export to CapCut draft" using the community CapCutAPI project; read its README and `--help` first,
never assume function names, never modify the user's CapCut install, and keep the normal MP4 export as the primary output.

## 6. Non-negotiables
- Respect open-source licences: keep notices, record third-party code in THIRD_PARTY_NOTICES.md.
- Real data only: no fake statuses, no invented numbers, no stock imagery. Mock data lives behind `?dev=1`.
- Every long task shows progress and can be cancelled. Every error shows the failing command and its log.
- Use only argument-array process spawns; validate all paths; keep the server on localhost.
- Write `README.md` with install and run steps (`pnpm i`, `pnpm dev`), required tools (Node 22+, FFmpeg, Python for Whisper/Kokoro) and a `doctor` command that checks them.
- After each phase: run tests, run the screenshot QA loop, update `docs/PROGRESS.md`, and stop for my review.

## 7. Start now
Begin with a short plan, then create the monorepo, design tokens and the Phase 1 UI shell. Show me a screenshot next to the reference image when the shell is done.
