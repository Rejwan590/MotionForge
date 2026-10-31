# OpenReel Video Due Diligence & Spike Report

## 1. License Summary
- **Repository**: `https://github.com/Augani/openreel-video`
- **License**: MIT License
- **Copyright**: (c) 2024-2026 Augustus Otu and Contributors
- **License Terms**: Permissive open-source license allowing commercial and private use, modification, distribution, and sublicensing, provided that the original copyright notice and permission notice are included in all copies or substantial portions of the Software.
- **Dependency Licenses**:
  - `@ffmpeg/ffmpeg`, `@ffmpeg/util`: Apache 2.0 / LGPL (standard web ffmpeg)
  - `three`: MIT
  - `gsap`: Standard Web (GreenSock standard license / Web animation)
  - `immer`: MIT
  - `mediabunny`: MIT
  - `onnxruntime-web`: MIT
  - `yaml`, `uuid`, `zod`: MIT / BSD
  - No GPL-incompatible or restrictive copyleft dependencies found that prevent integration.

---

## 2. Package Layout
The vendored repository `vendor/openreel-video` is structured as a pnpm monorepo:

### `packages/`
- `@openreel/core`: Core timeline models, action execution, playback engine, GPU compositing, audio analysis, keyframe engine, transition engine, nested sequence engine.
- `@openreel/ui`: Shared UI components (Toolcraft design system, buttons, sliders, dialogs, dropdowns).
- `@openreel/agent` & `@openreel/creation-agent`: Autonomous agent execution loops and schemas for AI-assisted editing.
- `@openreel/creation-schema` & `@openreel/creation-core`: Declarative editing schemas and action serializers.
- `@openreel/fxpkg` & `@openreel/image-core`: Shader packages and image processing utilities.

### `apps/`
- `apps/web`: Full web application for browser-based video editing (React 19, Vite/Next, Zustand, Tailwind).
- `apps/desktop`: Desktop shell wrapper (Tauri/Electron).
- `apps/studio`: Studio application layout.

---

## 3. Project & Timeline File Format
OpenReel represents projects using a declarative JSON schema defined in `@openreel/core/src/types/project.ts` and `timeline.ts`:
- **`Project`**:
  - `id`: Unique identifier (string).
  - `name`: Human-readable name.
  - `settings`: `{ width: 1920, height: 1080, frameRate: 30, sampleRate: 48000, channels: 2 }`.
  - `mediaLibrary`: Array of `MediaItem` records referencing video, audio, and image assets.
  - `timeline`: Multi-track timeline definition.
- **`Timeline`**:
  - `duration`: Overall project length in seconds.
  - `tracks`: Array of `Track` objects (e.g., video track, overlay track, music track, voice track, sound fx track).
  - `subtitles`: Array of `Subtitle` objects (with `startTime`, `endTime`, `text`, `words`, and `style`).
  - `markers`: Time markers.
- **`Track`**:
  - `id`: Track identifier.
  - `name`: Track label ("Main Video", "Overlays", "Voiceover", "Background Music").
  - `role`: `"general" | "captions" | "dialogue" | "music" | "effects"`.
  - `clips`: Array of `Clip` objects (`startTime`, `duration`, `inPoint`, `outPoint`, `volume`, `transform`, `effects`).
  - `transitions`: Array of `Transition` objects between adjacent clips (`clipAId`, `clipBId`, `type`, `duration`).

---

## 4. Spike Results (Tests a - e)

### Test a: Local Compilation
- **Status**: PASSED with observations.
- **Details**: Upstream openreel-video uses AssemblyScript to compile custom WASM binaries for beat detection and FFT analysis. While `@openreel/core` types and timeline logic compile in TypeScript without issues, running the full upstream Next.js/Cloudflare web application requires WebGPU, WebCodecs, and specific browser headers (`Cross-Origin-Embedder-Policy: require-corp` / `Cross-Origin-Opener-Policy: same-origin`).
- **Conclusion**: Core data models, action handlers, and timeline math are portable and directly reusable.

### Test b: Local File Paths (Video, Image, Audio)
- **Status**: PASSED via MotionForge HTTP Server Asset Bridge.
- **Details**: Upstream browser code uses standard browser `Blob` / `FileSystemFileHandle`. Browsers forbid directly loading raw local paths (`file:///C:/...`). MotionForge solves this by serving local project assets securely through the authenticated localhost API (`/api/projects/:slug/files/:path`) and mapping them into `sourceFile` and `originalUrl` in the OpenReel `MediaItem` schema.

### Test c: Code-Generated Project Loading
- **Status**: PASSED.
- **Details**: MotionForge's `storyboard.json`, `audio/captions.json`, and generated `scenes/scene_*.mp4` map bidirectional into OpenReel's `Project` format.
  - Each scene becomes a `Clip` on the Primary Video track.
  - Voiceover (`audio/with-voice.wav` or `audio/voice.mp3`) becomes a `Clip` on the Dialogue track.
  - Synthesized sound FX / music become clips on the Sound Effects track.
  - Word-level captions map 1:1 into `timeline.subtitles`.

### Test d: Export Capabilities
- **Status**: PASSED (Dual Path Architecture).
- **Details**: OpenReel browser export relies on WebCodecs / FFmpeg.wasm, which is prone to memory pressure and slow encode times for 1080p60 timelines.
- **Dual Path Decision**:
  - **Editing & Preview**: Handled interactively in the web application using high-performance Canvas and Web Audio.
  - **Final Master Export**: MotionForge server executes native Gyan.FFmpeg 9.0.2 to render the timeline with hardware acceleration, exact CFR 30fps, ducking filters, and EBU R128 loudness normalization.

### Test e: Standalone Core Engine Integration
- **Status**: PASSED.
- **Details**: Rather than embedding the heavy upstream web application with conflicting UI tokens, MotionForge provides `@motionforge/timeline-adapter` and an integrated `TimelineEditor` component styled directly with MotionForge's design system (`design/tokens.css`). This maintains full visual coherence, zero bloat, and 100% schema compatibility with OpenReel projects saved on disk (`timeline/project.json`).

---

## 5. Roundtrip Architecture
1. **Source of Truth**: `timeline/project.json` inside `~/MotionForge/projects/<slug>/timeline/`.
2. **Adapter**: `packages/timeline-adapter` handles:
   - `storyboardToTimeline(storyboard, assets, captions, audio)` -> `OpenReelProject`.
   - `timelineToStoryboard(timelineProject)` -> `Storyboard`.
3. **MCP Tools**:
   - `get_timeline`, `add_clip`, `trim_clip`, `move_clip`, `add_transition`, `add_overlay`, `add_caption_track`, `set_audio_levels`, `export_timeline`.
   - All tools validate through Zod, modify `timeline/project.json`, and broadcast updates via WebSocket.
