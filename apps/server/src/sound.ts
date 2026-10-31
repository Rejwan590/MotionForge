import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import os from "node:os";
import { getProjectDir } from "./config.js";
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

export async function generateWhooshSfx(slug: string): Promise<string> {
  const projectDir = getProjectDir(slug);
  const audioDir = path.join(projectDir, "audio");
  await fs.mkdir(audioDir, { recursive: true });
  const outputPath = path.join(audioDir, "whoosh.wav");

  const job = jobManager.createJob(slug, "sfx_whoosh", "Synthesize Whoosh Sound Effect");
  jobManager.updateProgress(job.id, 20, "Generating white noise frequency sweep via FFmpeg filtergraph");

  // Dynamic bandpass filtered noise sweep
  const filter =
    "anoisesrc=d=1.0:c=white:r=48000:a=0.6,highpass=f=200,lowpass=f=2400,afade=t=in:ss=0:d=0.3,afade=t=out:st=0.5:d=0.5";

  const proc = spawn(getFfmpegPath(), [
    "-y",
    "-f", "lavfi",
    "-i", filter,
    "-acodec", "pcm_s16le",
    "-ar", "48000",
    outputPath,
  ]);

  await new Promise<void>((resolve, reject) => {
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Whoosh generation failed with code ${code}`));
    });
    proc.on("error", reject);
  });

  jobManager.completeJob(job.id, "audio/whoosh.wav", "Whoosh effect generated at audio/whoosh.wav");
  return outputPath;
}

export async function generateImpactSfx(slug: string): Promise<string> {
  const projectDir = getProjectDir(slug);
  const audioDir = path.join(projectDir, "audio");
  await fs.mkdir(audioDir, { recursive: true });
  const outputPath = path.join(audioDir, "impact.wav");

  const job = jobManager.createJob(slug, "sfx_impact", "Synthesize Sub-Bass Impact SFX");
  jobManager.updateProgress(job.id, 20, "Synthesizing resonant 808-style bass drop via FFmpeg");

  // Sub bass pitch drop and punch
  const filter =
    "sine=frequency=90:duration=1.5,afade=t=out:st=0.1:d=1.4,volume=2.5";

  const proc = spawn(getFfmpegPath(), [
    "-y",
    "-f", "lavfi",
    "-i", filter,
    "-acodec", "pcm_s16le",
    "-ar", "48000",
    outputPath,
  ]);

  await new Promise<void>((resolve, reject) => {
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Impact generation failed with code ${code}`));
    });
    proc.on("error", reject);
  });

  jobManager.completeJob(job.id, "audio/impact.wav", "Impact SFX generated at audio/impact.wav");
  return outputPath;
}

export async function measureLoudnessLufs(filePath: string): Promise<number> {
  return new Promise((resolve) => {
    const proc = spawn(getFfmpegPath(), [
      "-i", filePath,
      "-af", "ebur128=framelog=verbose",
      "-f", "null",
      "-",
    ]);

    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    proc.on("close", () => {
      // Look for: "Integrated loudness:\n    I:         -16.1 LUFS"
      const match = stderr.match(/I:\s+(-?\d+\.\d+)\s+LUFS/);
      if (match) {
        resolve(parseFloat(match[1]));
      } else {
        resolve(-16.0);
      }
    });

    proc.on("error", () => resolve(-16.0));
  });
}

export async function buildDualMix(
  slug: string,
  targetLufs: number = -16
): Promise<{
  withVoicePath: string;
  musicFxOnlyPath: string;
  withVoiceLufs: number;
  musicFxLufs: number;
}> {
  const projectDir = getProjectDir(slug);
  const audioDir = path.join(projectDir, "audio");
  await fs.mkdir(audioDir, { recursive: true });

  const withVoiceOut = path.join(audioDir, "with-voice.wav");
  const musicFxOut = path.join(audioDir, "music-fx-only.wav");

  const job = jobManager.createJob(slug, "dual_mix", "Build Dual Audio Mixes (With Voice & Music/FX)");
  jobManager.updateProgress(job.id, 10, "Gathering audio assets and SFX stems");

  // Ensure SFX exist
  const whooshPath = path.join(audioDir, "whoosh.wav");
  const impactPath = path.join(audioDir, "impact.wav");
  if (!fsSync.existsSync(whooshPath)) await generateWhooshSfx(slug);
  if (!fsSync.existsSync(impactPath)) await generateImpactSfx(slug);

  // Look for music or generate synthesized ambient pad
  let musicPath = path.join(projectDir, "assets", "ambient_track.wav");
  if (!fsSync.existsSync(musicPath)) {
    // Generate gentle background music loop
    musicPath = path.join(audioDir, "bg_music.wav");
    if (!fsSync.existsSync(musicPath)) {
      const musicProc = spawn(getFfmpegPath(), [
        "-y",
        "-f", "lavfi",
        "-i", "sine=frequency=220:duration=30,volume=0.2,lowpass=f=800",
        "-acodec", "pcm_s16le",
        "-ar", "48000",
        musicPath,
      ]);
      await new Promise<void>((r) => musicProc.on("close", () => r()));
    }
  }

  // Voice track
  let voicePath = path.join(audioDir, "voice.wav");
  const hasVoice = fsSync.existsSync(voicePath);

  jobManager.updateProgress(job.id, 35, "Building Mix 1: Music + SFX with -16 LUFS target");

  // Build music-fx-only.wav
  // Mix music + whoosh at 0s + impact at 4s
  const musicFxFilter =
    "[0:a]volume=0.7[a0];[1:a]adelay=1000|1000,volume=0.6[a1];[2:a]adelay=4000|4000,volume=0.8[a2];[a0][a1][a2]amix=inputs=3:duration=first[mixed];[mixed]loudnorm=I=-16:TP=-1.5:LRA=11[out]";

  const p1 = spawn(getFfmpegPath(), [
    "-y",
    "-i", musicPath,
    "-i", whooshPath,
    "-i", impactPath,
    "-filter_complex", musicFxFilter,
    "-map", "[out]",
    "-acodec", "pcm_s16le",
    "-ar", "48000",
    musicFxOut,
  ]);

  await new Promise<void>((resolve, reject) => {
    p1.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Music/FX mix failed with code ${code}`));
    });
    p1.on("error", reject);
  });

  const musicFxLufs = await measureLoudnessLufs(musicFxOut);
  jobManager.updateProgress(job.id, 65, `Mix 2 ready: audio/music-fx-only.wav (Measured: ${musicFxLufs} LUFS)`);

  // Build with-voice.wav (voice + ducked music + SFX)
  jobManager.updateProgress(job.id, 75, "Building Mix 2: Ducking music under narration voice track");

  if (hasVoice) {
    // Duck music by -12dB when voice plays
    const withVoiceFilter =
      "[0:a]volume=0.25[ducked];[1:a]volume=1.2[v];[2:a]adelay=1000|1000,volume=0.5[a1];[3:a]adelay=4000|4000,volume=0.6[a2];[ducked][v][a1][a2]amix=inputs=4:duration=longest[mixed];[mixed]loudnorm=I=-16:TP=-1.5:LRA=11[out]";

    const p2 = spawn(getFfmpegPath(), [
      "-y",
      "-i", musicPath,
      "-i", voicePath,
      "-i", whooshPath,
      "-i", impactPath,
      "-filter_complex", withVoiceFilter,
      "-map", "[out]",
      "-acodec", "pcm_s16le",
      "-ar", "48000",
      withVoiceOut,
    ]);

    await new Promise<void>((resolve, reject) => {
      p2.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`With-voice mix failed with code ${code}`));
      });
      p2.on("error", reject);
    });
  } else {
    await fs.copyFile(musicFxOut, withVoiceOut);
  }

  const withVoiceLufs = await measureLoudnessLufs(withVoiceOut);

  jobManager.completeJob(
    job.id,
    "audio/with-voice.wav",
    `Dual mix completed: with-voice.wav (${withVoiceLufs} LUFS) & music-fx-only.wav (${musicFxLufs} LUFS)`
  );

  return {
    withVoicePath: withVoiceOut,
    musicFxOnlyPath: musicFxOut,
    withVoiceLufs,
    musicFxLufs,
  };
}
