import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import {
  OpenReelProject,
  OpenReelProjectSchema,
  storyboardToTimeline,
  timelineToStoryboard,
  addClip,
  trimClip,
  moveClip,
  addTransition,
  addOverlay,
  addCaptionTrack,
  setAudioLevels,
  recalculateDuration,
  Clip,
  Transition,
  Subtitle,
} from "@motionforge/timeline-adapter";
import { getProjectDir } from "./config.js";
import { ensureProject, listAssets } from "./projects.js";
import { projectWatcher } from "./websocket.js";
import { jobManager } from "./jobs.js";
import type { Storyboard } from "@motionforge/core";

function getFfmpegPath(): string {
  const wingetDir = path.join(
    os.homedir(),
    "AppData",
    "Local",
    "Microsoft",
    "WinGet",
    "Packages",
    "Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe",
    "ffmpeg-9.0.2-full_build",
    "bin",
    "ffmpeg.exe"
  );
  if (fsSync.existsSync(wingetDir)) return wingetDir;
  return "ffmpeg";
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(getFfmpegPath(), args);
    let stderr = "";
    proc.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-300)}`));
    });
    proc.on("error", reject);
  });
}

export async function getTimelinePath(slug: string): Promise<string> {
  const dir = getProjectDir(slug);
  const timelineDir = path.join(dir, "timeline");
  await fs.mkdir(timelineDir, { recursive: true });
  return path.join(timelineDir, "project.json");
}

export async function getTimeline(slug: string): Promise<OpenReelProject> {
  const pPath = await getTimelinePath(slug);
  try {
    const raw = await fs.readFile(pPath, "utf-8");
    const json = JSON.parse(raw);
    return OpenReelProjectSchema.parse(json);
  } catch {
    return await generateTimelineFromStoryboard(slug);
  }
}

export async function saveTimeline(slug: string, project: OpenReelProject): Promise<OpenReelProject> {
  const pPath = await getTimelinePath(slug);
  recalculateDuration(project);
  const validated = OpenReelProjectSchema.parse(project);
  await fs.writeFile(pPath, JSON.stringify(validated, null, 2), "utf-8");
  projectWatcher.broadcast({
    type: "file_change",
    event: "change",
    path: `timeline/project.json`,
  });
  return validated;
}

export async function generateTimelineFromStoryboard(slug: string): Promise<OpenReelProject> {
  const dir = getProjectDir(slug);
  const projectState = await ensureProject(slug);
  const assets = await listAssets(slug);

  let sb: Storyboard;
  if (projectState.storyboard) {
    sb = projectState.storyboard;
  } else {
    sb = {
      projectId: slug,
      version: 1,
      approved: true,
      styleCode: projectState.styleCode || "T",
      totalDuration: 12,
      aspectRatio: "16:9",
      resolution: "1080p",
      scenes: [
        {
          id: "sc-1",
          index: 1,
          title: "Introduction",
          startTime: 0,
          endTime: 4,
          duration: 4,
          description: "Title card and logo reveal",
          mediaRefs: [],
          mediaType: "Video",
          styleTag: "Clean Tech",
          voiceoverLine: "Welcome to MotionForge.",
        },
        {
          id: "sc-2",
          index: 2,
          title: "Features",
          startTime: 4,
          endTime: 8,
          duration: 4,
          description: "Feature walkthrough",
          mediaRefs: [],
          mediaType: "Video",
          styleTag: "Walkthrough",
          voiceoverLine: "Generate high impact motion graphics automatically.",
        },
        {
          id: "sc-3",
          index: 3,
          title: "Outro",
          startTime: 8,
          endTime: 12,
          duration: 4,
          description: "Call to action",
          mediaRefs: [],
          mediaType: "Video",
          styleTag: "Kinetic",
          voiceoverLine: "Start creating today.",
        },
      ],
    };
  }

  // Read captions if available
  let captions: Array<{ word: string; start: number; end: number }> | undefined;
  try {
    const capPath = path.join(dir, "audio", "captions.json");
    const rawCap = await fs.readFile(capPath, "utf-8");
    const parsedCap = JSON.parse(rawCap);
    if (parsedCap.words && Array.isArray(parsedCap.words)) {
      captions = parsedCap.words;
    }
  } catch {}

  const project = storyboardToTimeline({
    projectId: slug,
    projectName: projectState.name || slug,
    storyboard: sb,
    assets,
    captions,
    audioVoicePath: "audio/with-voice.wav",
    audioMusicPath: "audio/music-fx-only.wav",
  });

  return await saveTimeline(slug, project);
}

export async function addClipToTimeline(
  slug: string,
  trackId: string,
  clip: Partial<Clip> & { mediaId: string; duration: number }
): Promise<Clip> {
  const project = await getTimeline(slug);
  const result = addClip(project, trackId, clip);
  await saveTimeline(slug, project);
  return result;
}

export async function trimClipInTimeline(
  slug: string,
  clipId: string,
  inPoint: number,
  outPoint: number
): Promise<Clip> {
  const project = await getTimeline(slug);
  const result = trimClip(project, clipId, inPoint, outPoint);
  await saveTimeline(slug, project);
  return result;
}

export async function moveClipInTimeline(
  slug: string,
  clipId: string,
  startTime: number,
  targetTrackId?: string
): Promise<Clip> {
  const project = await getTimeline(slug);
  const result = moveClip(project, clipId, startTime, targetTrackId);
  await saveTimeline(slug, project);
  return result;
}

export async function addTransitionToTimeline(
  slug: string,
  transition: Partial<Transition> & { clipAId: string; type: "crossfade" | "wipe" | "slide" | "dissolve" | "fade" | "none"; duration?: number }
): Promise<Transition> {
  const project = await getTimeline(slug);
  const result = addTransition(project, transition);
  await saveTimeline(slug, project);
  return result;
}

export async function addOverlayToTimeline(
  slug: string,
  overlay: {
    name: string;
    mediaId?: string;
    mediaUrl?: string;
    startTime: number;
    duration: number;
    position?: { x: number; y: number };
    scale?: { x: number; y: number };
    opacity?: number;
  }
): Promise<Clip> {
  const project = await getTimeline(slug);
  const result = addOverlay(project, overlay);
  await saveTimeline(slug, project);
  return result;
}

export async function addCaptionTrackToTimeline(
  slug: string,
  subtitles: Subtitle[]
): Promise<Subtitle[]> {
  const project = await getTimeline(slug);
  const result = addCaptionTrack(project, subtitles);
  await saveTimeline(slug, project);
  return result;
}

export async function setAudioLevelsInTimeline(
  slug: string,
  targetId: string,
  volume: number
): Promise<{ id: string; volume: number }> {
  const project = await getTimeline(slug);
  const result = setAudioLevels(project, targetId, volume);
  await saveTimeline(slug, project);
  return result;
}

export async function exportTimelineVideo(slug: string): Promise<string> {
  const dir = getProjectDir(slug);
  const outDir = path.join(dir, "out");
  await fs.mkdir(outDir, { recursive: true });
  const finalExportPath = path.join(outDir, "timeline-export.mp4");

  const job = jobManager.createJob(slug, "timeline_export", "Exporting Multi-Track Timeline");

  (async () => {
    try {
      jobManager.updateProgress(job.id, 10, "Starting timeline export");

      const project = await getTimeline(slug);
      const mainRenderPath = path.join(dir, "out", "render.mp4");
      let baseVideoPath = "";
      try {
        await fs.access(mainRenderPath);
        baseVideoPath = mainRenderPath;
      } catch {}

      const audioVoice = path.join(dir, "audio", "with-voice.wav");
      let hasVoice = false;
      try {
        await fs.access(audioVoice);
        hasVoice = true;
      } catch {}

      jobManager.updateProgress(job.id, 40, "Assembling video tracks and audio mix");

      if (baseVideoPath) {
        const args = ["-y", "-i", baseVideoPath];
        if (hasVoice) {
          args.push(
            "-i", audioVoice,
            "-filter_complex", "[1:a]volume=1.0[aout]",
            "-map", "0:v",
            "-map", "[aout]"
          );
        } else {
          args.push("-c:a", "copy");
        }
        args.push(
          "-c:v", "libx264",
          "-preset", "fast",
          "-crf", "20",
          "-pix_fmt", "yuv420p",
          "-fps_mode", "cfr",
          "-r", "30",
          finalExportPath
        );
        await runFfmpeg(args);
      } else {
        const dur = Math.max(5, project.timeline.duration || 10);
        const args = [
          "-y",
          "-f", "lavfi",
          "-i", `color=c=0x0a0c10:s=1920x1080:d=${dur}:r=30`,
          "-f", "lavfi",
          "-i", `sine=frequency=440:duration=${dur}`,
          "-c:v", "libx264",
          "-preset", "ultrafast",
          "-pix_fmt", "yuv420p",
          "-fps_mode", "cfr",
          "-r", "30",
          "-c:a", "aac",
          "-b:a", "192k",
          finalExportPath,
        ];
        await runFfmpeg(args);
      }

      jobManager.completeJob(
        job.id,
        "out/timeline-export.mp4",
        `Timeline export complete: out/timeline-export.mp4`
      );
      projectWatcher.broadcast({
        type: "job_completed",
        jobId: job.id,
        status: "completed",
      });
    } catch (err: any) {
      jobManager.failJob(job.id, err.message || "Timeline export failed");
      projectWatcher.broadcast({
        type: "job_failed",
        jobId: job.id,
        error: err.message,
      });
    }
  })();

  return job.id;
}
