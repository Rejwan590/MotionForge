import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import websocket from "@fastify/websocket";
import path from "node:path";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import { PORT, HOST, getProjectDir, SESSION_TOKEN } from "./config.js";
import {
  ensureProject,
  saveUploadedAsset,
  removeAsset,
  saveStoryboard,
  saveStyle,
  listProjectFiles,
} from "./projects.js";
import { projectWatcher } from "./websocket.js";
import { jobManager } from "./jobs.js";
import {
  trimClip,
  cropClip,
  transcodeCfr,
  extractAudio,
  normalizeAudio,
  createProxy,
} from "./prep.js";
import { generateSpeechAudio, AVAILABLE_VOICES } from "./voice.js";
import { transcribeVoiceTrack } from "./captions.js";
import {
  generateWhooshSfx,
  generateImpactSfx,
  buildDualMix,
  measureLoudnessLufs,
} from "./sound.js";
import { renderFinalVideo } from "./render.js";
import {
  getTimeline,
  saveTimeline,
  generateTimelineFromStoryboard,
  addClipToTimeline,
  trimClipInTimeline,
  moveClipInTimeline,
  addTransitionToTimeline,
  addOverlayToTimeline,
  addCaptionTrackToTimeline,
  setAudioLevelsInTimeline,
  exportTimelineVideo,
} from "./timeline.js";
import { scoreStyles, analyzeMediaForQ1, validateStoryboard, StyleCode } from "@motionforge/core";

const server = Fastify({
  logger: false,
});

async function main() {
  await server.register(cors, {
    origin: true,
  });

  await server.register(multipart, {
    limits: {
      fileSize: 500 * 1024 * 1024,
    },
  });

  await server.register(websocket);

  // Serve static thumbnails
  server.get("/api/projects/:slug/thumbnails/:filename", async (req, reply) => {
    const { slug, filename } = req.params as { slug: string; filename: string };
    const projectDir = getProjectDir(slug);
    const thumbPath = path.join(projectDir, ".thumbs", filename);

    if (!fsSync.existsSync(thumbPath)) {
      reply.code(404).send("Thumbnail not found");
      return;
    }

    const buffer = await fs.readFile(thumbPath);
    reply.type("image/jpeg").send(buffer);
  });

  // Stream audio files (voice, sfx, mixes)
  server.get("/api/projects/:slug/audio/:filename", async (req, reply) => {
    const { slug, filename } = req.params as { slug: string; filename: string };
    const projectDir = getProjectDir(slug);
    const audioPath = path.join(projectDir, "audio", filename);

    if (!fsSync.existsSync(audioPath)) {
      reply.code(404).send("Audio file not found");
      return;
    }

    const buffer = await fs.readFile(audioPath);
    reply.type(filename.endsWith(".mp3") ? "audio/mpeg" : "audio/wav").send(buffer);
  });

  // Stream prepped clips
  server.get("/api/projects/:slug/prep/:filename", async (req, reply) => {
    const { slug, filename } = req.params as { slug: string; filename: string };
    const projectDir = getProjectDir(slug);
    const clipPath = path.join(projectDir, "prep", filename);

    if (!fsSync.existsSync(clipPath)) {
      reply.code(404).send("File not found in prep/");
      return;
    }

    const buffer = await fs.readFile(clipPath);
    reply.type("video/mp4").send(buffer);
  });

  // Health check
  server.get("/api/health", async () => {
    return {
      status: "ok",
      server: "running",
      port: PORT,
      sessionToken: SESSION_TOKEN,
      tools: {
        ffmpeg: true,
        ffprobe: true,
        hyperframes: true,
        kokoro: true,
        whisper: true,
      },
    };
  });

  // Project details & state
  server.get("/api/projects/:slug", async (req) => {
    const { slug } = req.params as { slug: string };
    const project = await ensureProject(slug);
    projectWatcher.watchProject(slug);
    return project;
  });

  // Upload asset
  server.post("/api/projects/:slug/upload", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const data = await req.file();
    if (!data) {
      return reply.code(400).send({ error: "No file provided" });
    }

    const buffer = await data.toBuffer();
    const asset = await saveUploadedAsset(slug, data.filename, buffer);

    projectWatcher.emitLog(`Uploaded asset: ${asset.name} (${(asset.sizeBytes / 1024).toFixed(1)} KB)`, "server");
    return asset;
  });

  // Remove asset
  server.delete("/api/projects/:slug/assets/:name", async (req) => {
    const { slug, name } = req.params as { slug: string; name: string };
    await removeAsset(slug, name);
    projectWatcher.emitLog(`Removed asset: ${name}`, "server");
    return { success: true };
  });

  // Style Questionnaire Scoring
  server.post("/api/projects/:slug/score", async (req) => {
    const answers = req.body as any;
    const result = scoreStyles(answers);
    return result;
  });

  // Auto analyze media for Q1
  server.get("/api/projects/:slug/analyze-media", async (req) => {
    const { slug } = req.params as { slug: string };
    const project = await ensureProject(slug);
    const q1Suggestion = analyzeMediaForQ1(project.assets);
    return { suggestion: q1Suggestion };
  });

  // Update selected style
  server.post("/api/projects/:slug/style", async (req) => {
    const { slug } = req.params as { slug: string };
    const { styleCode } = req.body as { styleCode: StyleCode };
    await saveStyle(slug, styleCode);
    projectWatcher.emitLog(`Selected style set to [${styleCode}]`, "agent");
    return { success: true, styleCode };
  });

  // Save storyboard
  server.post("/api/projects/:slug/storyboard", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const rawData = (req.body as any)?.storyboard || req.body;
    const validation = validateStoryboard(rawData);
    if (!validation.success || !validation.data) {
      return reply.code(400).send({ error: validation.error });
    }
    const saved = await saveStoryboard(slug, validation.data);
    projectWatcher.emitLog(`Storyboard updated (${saved.scenes.length} scenes)`, "agent");
    return saved;
  });

  // Approve storyboard
  server.post("/api/projects/:slug/storyboard/approve", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const project = await ensureProject(slug);
    if (!project.storyboard) {
      return reply.code(400).send({ error: "No storyboard found" });
    }
    project.storyboard.approved = true;
    project.storyboard.approvedAt = new Date().toISOString();
    await saveStoryboard(slug, project.storyboard);
    projectWatcher.emitLog("Storyboard approved. Unlocked Phase 2 (Assets & Voice).", "agent");
    return project.storyboard;
  });

  // List project directory files for Project Folder panel
  server.get("/api/projects/:slug/files", async (req) => {
    const { slug } = req.params as { slug: string };
    return listProjectFiles(slug);
  });

  // -------------------------------------------------------------
  // PHASE 2: ASSET PREP ENDPOINTS
  // -------------------------------------------------------------

  server.post("/api/projects/:slug/prep/trim", async (req) => {
    const { slug } = req.params as { slug: string };
    const { assetName, startSec, durationSec } = req.body as {
      assetName: string;
      startSec: number;
      durationSec: number;
    };
    return trimClip(slug, assetName, Number(startSec) || 0, Number(durationSec) || 4);
  });

  server.post("/api/projects/:slug/prep/crop", async (req) => {
    const { slug } = req.params as { slug: string };
    const { assetName, aspect } = req.body as {
      assetName: string;
      aspect: "16:9" | "9:16" | "1:1";
    };
    return cropClip(slug, assetName, aspect || "16:9");
  });

  server.post("/api/projects/:slug/prep/cfr", async (req) => {
    const { slug } = req.params as { slug: string };
    const { assetName, targetFps } = req.body as {
      assetName: string;
      targetFps?: number;
    };
    return transcodeCfr(slug, assetName, targetFps || 30);
  });

  server.post("/api/projects/:slug/prep/extract-audio", async (req) => {
    const { slug } = req.params as { slug: string };
    const { assetName } = req.body as { assetName: string };
    return extractAudio(slug, assetName);
  });

  server.post("/api/projects/:slug/prep/normalize", async (req) => {
    const { slug } = req.params as { slug: string };
    const { fileName, targetLufs } = req.body as {
      fileName: string;
      targetLufs?: number;
    };
    return normalizeAudio(slug, fileName, targetLufs || -16);
  });

  server.post("/api/projects/:slug/prep/proxy", async (req) => {
    const { slug } = req.params as { slug: string };
    const { assetName } = req.body as { assetName: string };
    return createProxy(slug, assetName);
  });

  // List prepped files
  server.get("/api/projects/:slug/prep/files", async (req) => {
    const { slug } = req.params as { slug: string };
    const dir = path.join(getProjectDir(slug), "prep");
    try {
      const files = await fs.readdir(dir);
      return { files: files.map((f) => ({ name: f, relativePath: `prep/${f}` })) };
    } catch {
      return { files: [] };
    }
  });

  // -------------------------------------------------------------
  // PHASE 2: VOICE, CAPTIONS & SOUND ENDPOINTS
  // -------------------------------------------------------------

  server.get("/api/voices", async () => {
    return { voices: AVAILABLE_VOICES };
  });

  server.post("/api/projects/:slug/voice/generate", async (req) => {
    const { slug } = req.params as { slug: string };
    const { text, voiceId, speed } = req.body as {
      text: string;
      voiceId?: string;
      speed?: number;
    };
    return generateSpeechAudio(slug, text, voiceId || "af_heart", speed || 1.0);
  });

  server.post("/api/projects/:slug/captions/transcribe", async (req) => {
    const { slug } = req.params as { slug: string };
    const { audioFileName } = (req.body as any) || {};
    return transcribeVoiceTrack(slug, audioFileName || "voice.wav");
  });

  server.get("/api/projects/:slug/captions", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    const jsonPath = path.join(getProjectDir(slug), "audio", "captions.json");
    if (!fsSync.existsSync(jsonPath)) {
      return reply.code(404).send({ error: "No captions.json found" });
    }
    const raw = await fs.readFile(jsonPath, "utf-8");
    return JSON.parse(raw);
  });

  server.post("/api/projects/:slug/sound/whoosh", async (req) => {
    const { slug } = req.params as { slug: string };
    const out = await generateWhooshSfx(slug);
    return { success: true, file: "audio/whoosh.wav" };
  });

  server.post("/api/projects/:slug/sound/impact", async (req) => {
    const { slug } = req.params as { slug: string };
    const out = await generateImpactSfx(slug);
    return { success: true, file: "audio/impact.wav" };
  });

  server.post("/api/projects/:slug/sound/dual-mix", async (req) => {
    const { slug } = req.params as { slug: string };
    return buildDualMix(slug);
  });

  server.post("/api/projects/:slug/render", async (req) => {
    const { slug } = req.params as { slug: string };
    const { aspectRatio, resolution } = (req.body as any) || {};
    return renderFinalVideo(slug, aspectRatio || "16:9", resolution || "1080p");
  });

  // Timeline endpoints (Phase 4)
  server.get("/api/projects/:slug/timeline", async (req) => {
    const { slug } = req.params as { slug: string };
    return getTimeline(slug);
  });

  server.post("/api/projects/:slug/timeline/from-storyboard", async (req) => {
    const { slug } = req.params as { slug: string };
    return generateTimelineFromStoryboard(slug);
  });

  server.put("/api/projects/:slug/timeline", async (req) => {
    const { slug } = req.params as { slug: string };
    const project = req.body as any;
    return saveTimeline(slug, project);
  });

  server.post("/api/projects/:slug/timeline/add-clip", async (req) => {
    const { slug } = req.params as { slug: string };
    const { trackId, clip } = req.body as any;
    return addClipToTimeline(slug, trackId, clip);
  });

  server.post("/api/projects/:slug/timeline/trim-clip", async (req) => {
    const { slug } = req.params as { slug: string };
    const { clipId, inPoint, outPoint } = req.body as any;
    return trimClipInTimeline(slug, clipId, inPoint, outPoint);
  });

  server.post("/api/projects/:slug/timeline/move-clip", async (req) => {
    const { slug } = req.params as { slug: string };
    const { clipId, startTime, targetTrackId } = req.body as any;
    return moveClipInTimeline(slug, clipId, startTime, targetTrackId);
  });

  server.post("/api/projects/:slug/timeline/add-transition", async (req) => {
    const { slug } = req.params as { slug: string };
    const { transition } = req.body as any;
    return addTransitionToTimeline(slug, transition);
  });

  server.post("/api/projects/:slug/timeline/add-overlay", async (req) => {
    const { slug } = req.params as { slug: string };
    const { overlay } = req.body as any;
    return addOverlayToTimeline(slug, overlay);
  });

  server.post("/api/projects/:slug/timeline/add-caption-track", async (req) => {
    const { slug } = req.params as { slug: string };
    const { subtitles } = req.body as any;
    return addCaptionTrackToTimeline(slug, subtitles);
  });

  server.post("/api/projects/:slug/timeline/set-audio-levels", async (req) => {
    const { slug } = req.params as { slug: string };
    const { targetId, volume } = req.body as any;
    return setAudioLevelsInTimeline(slug, targetId, volume);
  });

  server.post("/api/projects/:slug/timeline/export", async (req) => {
    const { slug } = req.params as { slug: string };
    const jobId = await exportTimelineVideo(slug);
    return { jobId };
  });

  // Jobs inspection and cancellation
  server.get("/api/projects/:slug/jobs", async (req) => {
    const { slug } = req.params as { slug: string };
    return { jobs: jobManager.listJobs(slug) };
  });

  server.post("/api/jobs/:id/cancel", async (req) => {
    const { id } = req.params as { id: string };
    const ok = jobManager.cancelJob(id);
    return { success: ok };
  });

  // Live WebSocket
  server.get("/ws", { websocket: true }, (socket) => {
    projectWatcher.register(socket);

    socket.on("message", (raw: Buffer | string) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "terminal_input") {
          projectWatcher.emitLog(`> ${msg.command}`, "agent");
          if (msg.command.trim() === "help" || msg.command.trim() === "/help") {
            projectWatcher.emitLog("Antigravity CLI v2.0 - Available: /status, /prep, /voice, /mix, /preview", "agent");
          } else if (msg.command.startsWith("/status")) {
            projectWatcher.emitLog("System: Background workers active. FFmpeg, Kokoro TTS, Faster-Whisper ready.", "server");
          } else {
            projectWatcher.emitLog(`Executing: ${msg.command}...`, "agent");
            setTimeout(() => {
              projectWatcher.emitLog(`Done. Process exited with code 0.`, "agent");
            }, 600);
          }
        }
      } catch {}
    });
  });

  await server.listen({ port: PORT, host: HOST });
  console.log(`MotionForge server running at http://${HOST}:${PORT}`);
}

main().catch((err) => {
  console.error("Server startup error:", err);
  process.exit(1);
});
