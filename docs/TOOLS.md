# Tools and CLI Flags Reference

This document records the exact flags, capabilities, and options of the command-line tools used by MotionForge, verified against live binaries on the host system.

---

## 1. FFmpeg & FFprobe (v9.0.2-full_build-www.gyan.dev)

- **FFmpeg path**: `ffmpeg` (Gyan.FFmpeg 9.0.2)
- **Key enabled features**:
  - Codecs: `libx264`, `libx265`, `libvpx`, `libaom`, `librav1e`, `libsvtav1`, `libwebp`
  - Audio: `libmp3lame`, `libopus`, `libvorbis`, `libspeex`, `libopencore-amrnb`, `libopencore-amrwb`
  - Filters: `loudnorm` (EBU R128 loudness normalization), `afade`, `amix`, `scale`, `crop`, `fps`, `subtitles`
  - Speech: `--enable-whisper`

### Common FFmpeg Invocations
- **Extract Thumbnail**:
  ```bash
  ffmpeg -ss <timestamp> -i <input> -vframes 1 -q:v 2 <output.jpg>
  ```
- **Constant Frame Rate (30 fps) & Transcode**:
  ```bash
  ffmpeg -i <input> -r 30 -c:v libx264 -crf 20 -c:a aac -b:a 192k <output.mp4>
  ```
- **Crop to 16:9 / 9:16**:
  ```bash
  ffmpeg -i <input> -vf "crop=ih*(16/9):ih" ... # for 16:9 from wide/tall
  ffmpeg -i <input> -vf "crop=ih*(9/16):ih" ... # for 9:16
  ```
- **Loudness Normalization (-16 LUFS)**:
  ```bash
  ffmpeg -i <input> -af "loudnorm=I=-16:TP=-1.5:LRA=11" <output.wav>
  ```
- **FFprobe JSON Metadata**:
  ```bash
  ffprobe -v quiet -print_format json -show_format -show_streams <input>
  ```

---

## 2. HyperFrames CLI (`hyperframes` v0.8.221)

HyperFrames is the primary HTML-native video engine (Apache 2.0).

### Key Commands:
- `hyperframes init <name>`: Scaffold a new composition project.
- `hyperframes preview`: Start live-reload preview studio.
- `hyperframes lint`: Validate a composition for common mistakes.
- `hyperframes check`: Run lint, runtime validation, and layout inspection.
- `hyperframes render [options]`:
  - `-o, --output <path>`: Render target (e.g. `.mp4`).
  - `--format <format>`: MP4 or transparent WebM overlay (`--format webm`).
  - `--quality <quality>`: Render quality.
  - `--fps <fps>`: Frame rate (default: 30).
  - `--width <px>`, `--height <px>`: Output dimensions.
- `hyperframes tts [options] [input]`:
  - Uses local Kokoro-82M model.
  - `-v, --voice <voice>`: Voice ID (`af_heart`, `af_nova`, `af_sky`, `am_adam`, `am_michael`, `bf_emma`, `bf_isabella`, `bm_george`, etc.).
  - `-s, --speed <multiplier>`: Speech speed (default 1.0).
  - `-o, --output <output>`: Output WAV path.
  - `--list`: List all available Kokoro voices.
- `hyperframes transcribe [options] <input>`:
  - `-e, --engine <engine>`: `auto`, `parakeet`, or `whisper`.
  - `-m, --model <model>`: `tiny.en`, `base.en`, `small.en`, `medium.en`, `large-v3`.
  - `--to <srt|vtt>`: Export SRT or VTT caption sidecar with word-level timestamps.
  - `--json`: Output result as JSON to stdout.
- `hyperframes doctor`: Diagnose Node, FFmpeg, and Chrome runtime dependencies.

---

## 3. Speech-to-Text & Whisper

- **Engine 1 (HyperFrames Whisper / Parakeet)**:
  - `hyperframes transcribe <input> --to srt -o captions.srt --json`
- **Engine 2 (Python faster-whisper / whisper)**:
  - Supports `--model base`, `--output_format srt|json`, word timestamps.

---

## 4. Antigravity CLI & Process Integration

- **Binary / Launchers**:
  - `agy-node.cmd`: `C:\Users\Shamima Sultana Hira\AppData\Roaming\Antigravity\bin\agy-node.cmd`
  - `Antigravity.exe`: `C:\Users\Shamima Sultana Hira\AppData\Local\Programs\antigravity\Antigravity.exe`
  - In addition, node-pty terminal launches standard bash/powershell shells running `agy` or agent loops.
- **Config**:
  - `~/.gemini/antigravity/mcp_config.json`: MCP server registration.
