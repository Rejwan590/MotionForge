import { spawn, ChildProcess } from "node:child_process";
import path from "node:path";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import os from "node:os";
import { getProjectDir, isSafePath } from "./config.js";
import { jobManager } from "./jobs.js";
import { probeMedia } from "./ffmpeg.js";

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

function runFfmpegWithProgress(
  args: string[],
  jobId: string,
  totalDurationExpectedSec: number = 0
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const proc = spawn(getFfmpegPath(), args);
    const job = jobManager.getJob(jobId);
    if (job) {
      job.cancelFn = () => {
        try {
          proc.kill("SIGTERM");
        } catch {}
      };
    }

    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;

      // Extract time=00:00:01.50
      const timeMatch = text.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d+)/);
      if (timeMatch && totalDurationExpectedSec > 0) {
        const hours = parseFloat(timeMatch[1]);
        const mins = parseFloat(timeMatch[2]);
        const secs = parseFloat(timeMatch[3]);
        const currentSec = hours * 3600 + mins * 60 + secs;
        const pct = Math.min(98, Math.round((currentSec / totalDurationExpectedSec) * 100));
        jobManager.updateProgress(jobId, pct);
      }
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve({ success: true });
      } else {
        resolve({ success: false, error: stderr.slice(-500) || `Process exited with code ${code}` });
      }
    });

    proc.on("error", (err) => {
      resolve({ success: false, error: err.message });
    });
  });
}

export async function trimClip(
  slug: string,
  assetName: string,
  startSec: number,
  durationSec: number
) {
  const projectDir = getProjectDir(slug);
  const inputPath = path.join(projectDir, "assets", assetName);
  const ext = path.extname(assetName);
  const baseName = path.parse(assetName).name;
  const outName = `${baseName}_trim_${startSec}s_${durationSec}s${ext}`;
  const outputPath = path.join(projectDir, "prep", outName);

  if (!fsSync.existsSync(inputPath)) {
    throw new Error(`Asset ${assetName} not found in assets/`);
  }

  const job = jobManager.createJob(slug, "trim", `Trim ${assetName} (${startSec}s - ${startSec + durationSec}s)`);
  jobManager.updateProgress(job.id, 5, `Starting trim from ${startSec}s for ${durationSec}s`);

  const args = [
    "-y",
    "-ss", String(startSec),
    "-i", inputPath,
    "-t", String(durationSec),
    "-c:v", "libx264",
    "-preset", "fast",
    "-c:a", "aac",
    "-avoid_negative_ts", "make_zero",
    outputPath,
  ];

  const res = await runFfmpegWithProgress(args, job.id, durationSec);
  if (!res.success) {
    jobManager.failJob(job.id, res.error || "Trim failed");
    throw new Error(res.error);
  }

  const probe = await probeMedia(outputPath);
  jobManager.completeJob(job.id, `prep/${outName}`, `Trim complete: prep/${outName} (${probe.durationSeconds.toFixed(1)}s)`);
  return { outputPath, relativePath: `prep/${outName}`, metadata: probe };
}

export async function cropClip(
  slug: string,
  assetName: string,
  aspect: "16:9" | "9:16" | "1:1"
) {
  const projectDir = getProjectDir(slug);
  const inputPath = path.join(projectDir, "assets", assetName);
  const ext = path.extname(assetName);
  const baseName = path.parse(assetName).name;
  const aspectTag = aspect.replace(":", "x");
  const outName = `${baseName}_crop_${aspectTag}${ext}`;
  const outputPath = path.join(projectDir, "prep", outName);

  if (!fsSync.existsSync(inputPath)) throw new Error(`Asset not found: ${assetName}`);

  const probe = await probeMedia(inputPath);
  const job = jobManager.createJob(slug, "crop", `Crop ${assetName} to ${aspect}`);
  jobManager.updateProgress(job.id, 5, `Cropping video stream to aspect ${aspect}`);

  let cropFilter = "";
  if (aspect === "9:16") {
    // 9:16 vertical crop
    cropFilter = "crop=ih*(9/16):ih";
  } else if (aspect === "16:9") {
    // 16:9 landscape crop
    cropFilter = "crop=iw:iw*(9/16)";
  } else {
    // 1:1 square
    cropFilter = "crop=min(iw\\,ih):min(iw\\,ih)";
  }

  const args = [
    "-y",
    "-i", inputPath,
    "-vf", cropFilter,
    "-c:v", "libx264",
    "-preset", "fast",
    "-c:a", "copy",
    outputPath,
  ];

  const res = await runFfmpegWithProgress(args, job.id, probe.durationSeconds);
  if (!res.success) {
    jobManager.failJob(job.id, res.error || "Crop failed");
    throw new Error(res.error);
  }

  const outProbe = await probeMedia(outputPath);
  jobManager.completeJob(job.id, `prep/${outName}`, `Crop complete: ${outProbe.width}x${outProbe.height}`);
  return { outputPath, relativePath: `prep/${outName}`, metadata: outProbe };
}

export async function transcodeCfr(slug: string, assetName: string, targetFps = 30) {
  const projectDir = getProjectDir(slug);
  const inputPath = path.join(projectDir, "assets", assetName);
  const ext = path.extname(assetName);
  const baseName = path.parse(assetName).name;
  const outName = `${baseName}_cfr30${ext}`;
  const outputPath = path.join(projectDir, "prep", outName);

  if (!fsSync.existsSync(inputPath)) throw new Error(`Asset not found: ${assetName}`);

  const probe = await probeMedia(inputPath);
  const job = jobManager.createJob(slug, "cfr", `Convert ${assetName} to CFR ${targetFps}fps`);
  jobManager.updateProgress(job.id, 5, `Transcoding to constant frame rate ${targetFps} fps`);

  const args = [
    "-y",
    "-i", inputPath,
    "-r", String(targetFps),
    "-fps_mode", "cfr",
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "20",
  ];

  if (probe.hasAudio) {
    args.push("-c:a", "aac", "-b:a", "192k");
  } else {
    args.push("-an");
  }
  args.push(outputPath);

  const res = await runFfmpegWithProgress(args, job.id, probe.durationSeconds);
  if (!res.success) {
    jobManager.failJob(job.id, res.error || "CFR conversion failed");
    throw new Error(res.error);
  }

  const outProbe = await probeMedia(outputPath);
  jobManager.completeJob(job.id, `prep/${outName}`, `CFR 30fps conversion complete`);
  return { outputPath, relativePath: `prep/${outName}`, metadata: outProbe };
}

export async function extractAudio(slug: string, assetName: string) {
  const projectDir = getProjectDir(slug);
  const inputPath = path.join(projectDir, "assets", assetName);
  const baseName = path.parse(assetName).name;
  const outName = `${baseName}_audio.wav`;
  const outputPath = path.join(projectDir, "audio", outName);

  if (!fsSync.existsSync(inputPath)) throw new Error(`Asset not found: ${assetName}`);

  const probe = await probeMedia(inputPath);
  const job = jobManager.createJob(slug, "extract_audio", `Extract Audio from ${assetName}`);
  jobManager.updateProgress(job.id, 10, "Extracting audio stream to 48kHz WAV");

  const args = [
    "-y",
    "-i", inputPath,
  ];

  if (probe.hasAudio) {
    args.push("-vn", "-acodec", "pcm_s16le", "-ar", "48000", "-ac", "2", outputPath);
  } else {
    // If asset has no audio track, generate a matching 48kHz silent audio track for the video
    args.push("-f", "lavfi", "-i", `anullsrc=channel_layout=stereo:sample_rate=48000`, "-t", String(probe.durationSeconds || 2), outputPath);
  }

  const res = await runFfmpegWithProgress(args, job.id, probe.durationSeconds || 2);
  if (!res.success) {
    jobManager.failJob(job.id, res.error || "Audio extraction failed");
    throw new Error(res.error);
  }

  const outProbe = await probeMedia(outputPath);
  jobManager.completeJob(job.id, `audio/${outName}`, `Extracted audio track to audio/${outName}`);
  return { outputPath, relativePath: `audio/${outName}`, metadata: outProbe };
}

export async function normalizeAudio(slug: string, fileName: string, targetLufs = -16) {
  const projectDir = getProjectDir(slug);
  // Can be in assets/ or audio/ or prep/
  let inputPath = path.join(projectDir, "audio", fileName);
  if (!fsSync.existsSync(inputPath)) {
    inputPath = path.join(projectDir, "assets", fileName);
  }
  if (!fsSync.existsSync(inputPath)) {
    inputPath = path.join(projectDir, "prep", fileName);
  }
  if (!fsSync.existsSync(inputPath)) throw new Error(`Audio file not found: ${fileName}`);

  const baseName = path.parse(fileName).name;
  const outName = `${baseName}_norm_${Math.abs(targetLufs)}lufs.wav`;
  const outputPath = path.join(projectDir, "audio", outName);

  const probe = await probeMedia(inputPath);
  const job = jobManager.createJob(slug, "normalize", `Normalize Loudness (${targetLufs} LUFS) for ${fileName}`);
  jobManager.updateProgress(job.id, 10, `Applying EBU R128 loudness normalization to ${targetLufs} LUFS`);

  const args = [
    "-y",
    "-i", inputPath,
    "-af", `loudnorm=I=${targetLufs}:TP=-1.5:LRA=11`,
    "-acodec", "pcm_s16le",
    "-ar", "48000",
    outputPath,
  ];

  const res = await runFfmpegWithProgress(args, job.id, probe.durationSeconds);
  if (!res.success) {
    jobManager.failJob(job.id, res.error || "Loudness normalization failed");
    throw new Error(res.error);
  }

  jobManager.completeJob(job.id, `audio/${outName}`, `Normalized loudness to ${targetLufs} LUFS`);
  return { outputPath, relativePath: `audio/${outName}` };
}

export async function createProxy(slug: string, assetName: string) {
  const projectDir = getProjectDir(slug);
  const inputPath = path.join(projectDir, "assets", assetName);
  const baseName = path.parse(assetName).name;
  const outName = `${baseName}_proxy.mp4`;
  const outputPath = path.join(projectDir, "prep", outName);

  if (!fsSync.existsSync(inputPath)) throw new Error(`Asset not found: ${assetName}`);

  const probe = await probeMedia(inputPath);
  const job = jobManager.createJob(slug, "proxy", `Generate Fast Preview Proxy for ${assetName}`);
  jobManager.updateProgress(job.id, 10, "Encoding 540p lightweight proxy for fast preview");

  const args = [
    "-y",
    "-i", inputPath,
    "-vf", "scale=-2:540",
    "-c:v", "libx264",
    "-crf", "26",
    "-preset", "veryfast",
    "-c:a", "aac",
    "-b:a", "96k",
    outputPath,
  ];

  const res = await runFfmpegWithProgress(args, job.id, probe.durationSeconds);
  if (!res.success) {
    jobManager.failJob(job.id, res.error || "Proxy generation failed");
    throw new Error(res.error);
  }

  const outProbe = await probeMedia(outputPath);
  jobManager.completeJob(job.id, `prep/${outName}`, `Preview proxy ready (${outProbe.width}x${outProbe.height})`);
  return { outputPath, relativePath: `prep/${outName}`, metadata: outProbe };
}
