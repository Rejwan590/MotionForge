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

export interface VoiceOption {
  id: string;
  name: string;
  engine: "kokoro" | "edge-tts" | "piper";
  lang: string;
  gender: "female" | "male";
  sampleText: string;
}

export const AVAILABLE_VOICES: VoiceOption[] = [
  { id: "af_heart", name: "Heart (Kokoro)", engine: "kokoro", lang: "en-US", gender: "female", sampleText: "Welcome to MotionForge, turning your ideas into videos." },
  { id: "af_nova", name: "Nova (Kokoro)", engine: "kokoro", lang: "en-US", gender: "female", sampleText: "High energy explainer narration with crystal clarity." },
  { id: "af_sky", name: "Sky (Kokoro)", engine: "kokoro", lang: "en-US", gender: "female", sampleText: "Calm and natural product presentation voice." },
  { id: "am_adam", name: "Adam (Kokoro)", engine: "kokoro", lang: "en-US", gender: "male", sampleText: "Authoritative, confident voice for software walkthroughs." },
  { id: "am_michael", name: "Michael (Kokoro)", engine: "kokoro", lang: "en-US", gender: "male", sampleText: "Friendly tutorial narrator with clear pacing." },
  { id: "bf_emma", name: "Emma (Kokoro British)", engine: "kokoro", lang: "en-GB", gender: "female", sampleText: "Sophisticated British narration for documentaries." },
  { id: "bm_george", name: "George (Kokoro British)", engine: "kokoro", lang: "en-GB", gender: "male", sampleText: "Warm British voice ideal for storytelling." },
  { id: "en-US-JennyNeural", name: "Jenny (Edge Neural)", engine: "edge-tts", lang: "en-US", gender: "female", sampleText: "Dynamic, versatile neural narrator." },
  { id: "en-US-GuyNeural", name: "Guy (Edge Neural)", engine: "edge-tts", lang: "en-US", gender: "male", sampleText: "Conversational and polished explainer tone." },
];

async function runEdgeTts(text: string, voiceId: string, outputWavPath: string, audioDir: string): Promise<boolean> {
  const tempMp3 = path.join(audioDir, `_temp_${Date.now()}.mp3`);
  const tempPy = path.join(audioDir, `_temp_tts_${Date.now()}.py`);

  const pyCode = `import asyncio
import edge_tts

async def main():
    communicate = edge_tts.Communicate(${JSON.stringify(text)}, ${JSON.stringify(voiceId)})
    await communicate.save(${JSON.stringify(tempMp3)})

asyncio.run(main())
`;

  try {
    await fs.writeFile(tempPy, pyCode, "utf-8");
    const pyOk = await new Promise<boolean>((resolve) => {
      const proc = spawn("python", [tempPy]);
      proc.on("close", (code) => resolve(code === 0));
      proc.on("error", () => resolve(false));
    });

    if (!pyOk || !fsSync.existsSync(tempMp3)) {
      return false;
    }

    // Convert MP3 to 48kHz stereo WAV using FFmpeg
    const ffmpegOk = await new Promise<boolean>((resolve) => {
      const proc = spawn(getFfmpegPath(), [
        "-y",
        "-i", tempMp3,
        "-c:a", "pcm_s16le",
        "-ar", "48000",
        "-ac", "2",
        outputWavPath,
      ]);
      proc.on("close", (code) => resolve(code === 0));
      proc.on("error", () => resolve(false));
    });

    return ffmpegOk && fsSync.existsSync(outputWavPath);
  } finally {
    // Clean up temporary files
    try { await fs.unlink(tempPy); } catch {}
    try { await fs.unlink(tempMp3); } catch {}
  }
}

export async function generateSpeechAudio(
  slug: string,
  text: string,
  voiceId: string = "af_heart",
  speed: number = 1.0,
  outputFileName: string = "voice.wav"
): Promise<{ outputPath: string; relativePath: string; duration: number }> {
  const projectDir = getProjectDir(slug);
  const audioDir = path.join(projectDir, "audio");
  await fs.mkdir(audioDir, { recursive: true });
  const outputPath = path.join(audioDir, outputFileName);

  const job = jobManager.createJob(slug, "voice_gen", `Generate Narration (${voiceId})`);
  jobManager.updateProgress(job.id, 10, `Synthesizing ${text.split(" ").length} words using ${voiceId}`);

  const selectedVoice = AVAILABLE_VOICES.find((v) => v.id === voiceId) || AVAILABLE_VOICES[0];
  let success = false;

  if (selectedVoice.engine === "edge-tts") {
    success = await runEdgeTts(text, voiceId, outputPath, audioDir);
  } else {
    // Try hyperframes tts first
    const hyperframesPromise = new Promise<boolean>((resolve) => {
      const proc = spawn("npx", [
        "hyperframes", "tts",
        "-v", voiceId,
        "-s", String(speed),
        "-o", outputPath,
        text,
      ], { shell: true });

      proc.on("close", (code) => resolve(code === 0));
      proc.on("error", () => resolve(false));
    });

    success = await hyperframesPromise;

    // If hyperframes tts not available or failed, fallback cleanly to Neural Edge-TTS
    if (!success || !fsSync.existsSync(outputPath) || fsSync.statSync(outputPath).size === 0) {
      jobManager.updateProgress(job.id, 40, "Using high-fidelity Neural Edge-TTS engine");
      const fallbackVoice = "en-US-JennyNeural";
      success = await runEdgeTts(text, fallbackVoice, outputPath, audioDir);
    }
  }

  if (!success || !fsSync.existsSync(outputPath) || fsSync.statSync(outputPath).size === 0) {
    jobManager.failJob(job.id, "Speech synthesis failed");
    throw new Error("TTS generation failed");
  }

  const probe = await probeMedia(outputPath);
  jobManager.completeJob(
    job.id,
    `audio/${outputFileName}`,
    `Voice narration generated: audio/${outputFileName} (${probe.durationSeconds.toFixed(1)}s)`
  );

  return {
    outputPath,
    relativePath: `audio/${outputFileName}`,
    duration: probe.durationSeconds,
  };
}
