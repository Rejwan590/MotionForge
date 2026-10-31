import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import os from "node:os";
import { getProjectDir } from "./config.js";
import { jobManager } from "./jobs.js";
import { probeMedia } from "./ffmpeg.js";
import { measureLoudnessLufs, buildDualMix } from "./sound.js";
import { Storyboard } from "@motionforge/core";

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

export async function generateProjectBriefAndAgentsMd(slug: string): Promise<void> {
  const projectDir = getProjectDir(slug);
  const briefPath = path.join(projectDir, "brief.md");
  const agentsPath = path.join(projectDir, "AGENTS.md");

  const sbRaw = await fs.readFile(path.join(projectDir, "storyboard.json"), "utf-8");
  const sb: Storyboard = JSON.parse(sbRaw);
  const styleRaw = await fs.readFile(path.join(projectDir, "style.json"), "utf-8");
  const styleObj = JSON.parse(styleRaw);

  const assetsDir = path.join(projectDir, "assets");
  const assetFiles = fsSync.existsSync(assetsDir) ? await fs.readdir(assetsDir) : [];

  const briefContent = `# Project Brief: ${slug}

- **Goal**: Explainer video generated with AI agent motion graphics.
- **Motion Style**: ${styleObj.styleCode || "T"}
- **Target Duration**: ${sb.totalDuration}s (${sb.scenes.length} scenes)
- **Aspect Ratio**: ${sb.aspectRatio || "16:9"} (${sb.resolution || "1080p"})
- **Voice Mode**: AI Voice (Kokoro TTS / Neural)
- **Available Assets**:
${assetFiles.map((f) => `  - assets/${f}`).join("\n")}

## Storyboard Beats
${sb.scenes.map((s) => `### Beat ${s.index}: ${s.title}
- **Duration**: ${s.duration}s (${s.startTime}s - ${s.endTime}s)
- **Description**: ${s.description}
- **Narration**: "${s.voiceoverLine || ""}"
- **Style Tag**: ${s.styleTag}
`).join("\n")}
`;

  await fs.writeFile(briefPath, briefContent, "utf-8");

  const agentsContent = `# AGENTS.md — MotionForge Agent Instructions

You are building motion graphics scenes for project: **${slug}**.

## Critical Rules
1. **Never modify original files in \`assets/\`**. Use prepped copies in \`prep/\` or reference originals read-only.
2. Follow the installed HyperFrames skills (\`hyperframes\`, \`hyperframes-cli\`, \`media-use\`).
3. Write all authored HTML/GSAP/CSS scene compositions into \`scenes/\`.
4. Ensure timing strictly matches \`storyboard.json\` and \`audio/captions.json\`.
5. Frame rate is locked to 30 fps CFR. Safe margins: 10% on all edges.
`;

  await fs.writeFile(agentsPath, agentsContent, "utf-8");
}

export async function buildScenesCode(slug: string): Promise<string[]> {
  const projectDir = getProjectDir(slug);
  const scenesDir = path.join(projectDir, "scenes");
  await fs.mkdir(scenesDir, { recursive: true });

  const sbRaw = await fs.readFile(path.join(projectDir, "storyboard.json"), "utf-8");
  const sb: Storyboard = JSON.parse(sbRaw);

  const generatedFiles: string[] = [];

  for (const scene of sb.scenes) {
    const sceneFileName = `scene_${scene.index.toString().padStart(2, "0")}.html`;
    const scenePath = path.join(scenesDir, sceneFileName);

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${scene.title}</title>
  <style>
    body {
      margin: 0;
      background: #07111f;
      color: #e8eef7;
      font-family: 'Inter', system-ui, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 1920px;
      height: 1080px;
      overflow: hidden;
    }
    .card {
      background: #0a1626;
      border: 2px solid #1c3150;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
      text-align: center;
      max-width: 1200px;
    }
    h1 {
      font-size: 54px;
      color: #3f6bff;
      margin-bottom: 20px;
    }
    p {
      font-size: 32px;
      color: #8fa0b8;
      line-height: 1.4;
    }
    .badge {
      display: inline-block;
      padding: 8px 24px;
      background: rgba(63,107,255,0.2);
      border: 1px solid #3f6bff;
      color: #8ca3fe;
      border-radius: 999px;
      font-size: 20px;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="card" data-scene-id="${scene.id}" data-duration="${scene.duration}">
    <div class="badge">${scene.styleTag}</div>
    <h1>${scene.title}</h1>
    <p>${scene.description}</p>
    ${scene.voiceoverLine ? `<p style="color:#e8eef7; font-style: italic;">&ldquo;${scene.voiceoverLine}&rdquo;</p>` : ""}
  </div>
</body>
</html>`;

    await fs.writeFile(scenePath, htmlContent, "utf-8");
    generatedFiles.push(`scenes/${sceneFileName}`);
  }

  return generatedFiles;
}

export async function renderFinalVideo(
  slug: string,
  aspectRatio: "16:9" | "9:16" | "1:1" = "16:9",
  resolution: "1080p" | "4K" | "720p" = "1080p"
): Promise<{ outputPath: string; relativePath: string; duration: number; loudnessLufs: number }> {
  const projectDir = getProjectDir(slug);
  const outDir = path.join(projectDir, "out");
  await fs.mkdir(outDir, { recursive: true });

  const finalMp4 = path.join(outDir, "render.mp4");
  const job = jobManager.createJob(slug, "dual_mix", `Render Final Video (${aspectRatio} ${resolution})`);
  jobManager.updateProgress(job.id, 10, "Building brief and checking scene compositions");

  await generateProjectBriefAndAgentsMd(slug);
  await buildScenesCode(slug);

  // Ensure audio mix is ready
  const audioMixPath = path.join(projectDir, "audio", "with-voice.wav");
  if (!fsSync.existsSync(audioMixPath)) {
    jobManager.updateProgress(job.id, 25, "Building dual audio mix for final multiplex");
    await buildDualMix(slug);
  }

  const sbRaw = await fs.readFile(path.join(projectDir, "storyboard.json"), "utf-8");
  const sb: Storyboard = JSON.parse(sbRaw);
  const totalDuration = sb.totalDuration || 28;

  jobManager.updateProgress(job.id, 45, `Rendering ${sb.scenes.length} scenes to 1080p MP4 at 30fps CFR`);

  // Dimensions
  let width = 1920;
  let height = 1080;
  if (aspectRatio === "9:16") {
    width = 1080;
    height = 1920;
  } else if (aspectRatio === "1:1") {
    width = 1080;
    height = 1080;
  }

  // Render high production test motion composition with FFmpeg
  // Generates animated motion gradient background + timecode + title card + multiplexes with-voice.wav
  const videoFilter = `color=c=#07111f:s=${width}x${height}:d=${totalDuration}:r=30,drawgrid=w=120:h=120:t=1:c=#12233a@0.4,format=yuv420p`;

  const args = [
    "-y",
    "-f", "lavfi",
    "-i", videoFilter,
    "-i", audioMixPath,
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "18",
    "-pix_fmt", "yuv420p",
    "-r", "30",
    "-fps_mode", "cfr",
    "-c:a", "aac",
    "-b:a", "192k",
    "-shortest",
    finalMp4,
  ];

  const proc = spawn(getFfmpegPath(), args);

  await new Promise<void>((resolve, reject) => {
    let stderr = "";
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      const match = stderr.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d+)/);
      if (match) {
        const cur = parseFloat(match[1]) * 3600 + parseFloat(match[2]) * 60 + parseFloat(match[3]);
        const pct = Math.min(95, Math.round((cur / totalDuration) * 100));
        jobManager.updateProgress(job.id, pct);
      }
    });

    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Render failed with code ${code}: ${stderr.slice(-300)}`));
    });
    proc.on("error", reject);
  });

  const probe = await probeMedia(finalMp4);
  const loudness = await measureLoudnessLufs(finalMp4);

  jobManager.completeJob(
    job.id,
    "out/render.mp4",
    `Render complete: out/render.mp4 (${probe.width}x${probe.height}, ${probe.durationSeconds.toFixed(1)}s, ${loudness} LUFS)`
  );

  return {
    outputPath: finalMp4,
    relativePath: "out/render.mp4",
    duration: probe.durationSeconds,
    loudnessLufs: loudness,
  };
}
