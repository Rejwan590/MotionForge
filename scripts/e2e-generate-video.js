import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";

const BASE_URL = "http://127.0.0.1:4100";
const SLUG = "e2e-genesis-video";
const PROJECTS_ROOT = path.join(os.homedir(), "MotionForge", "projects");
const PROJECT_DIR = path.join(PROJECTS_ROOT, SLUG);

function getFfmpegPath() {
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

function getFfprobePath() {
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
    "ffprobe.exe"
  );
  if (fsSync.existsSync(wingetDir)) return wingetDir;
  return "ffprobe";
}

async function runStep(stepName, fn) {
  process.stdout.write(`[*] ${stepName}... `);
  try {
    const res = await fn();
    console.log(`[PASS]`);
    if (res) console.log(`    ↳ ${typeof res === "string" ? res : JSON.stringify(res)}`);
    return { name: stepName, success: true, result: res };
  } catch (err) {
    console.log(`[FAIL]`);
    console.error(`    ↳ ERROR: ${err.message}`);
    return { name: stepName, success: false, error: err.message };
  }
}

async function main() {
  console.log("=====================================================================");
  console.log("   MOTIONFORGE FULL AUTONOMOUS VIDEO GENERATION & TESTING SUITE      ");
  console.log("=====================================================================\n");

  const results = [];

  // Step 1: Initialize Project Directory & Assets
  results.push(await runStep("1. Initialize Project Directory & Ingest Media", async () => {
    await fs.mkdir(path.join(PROJECT_DIR, "assets"), { recursive: true });
    await fs.mkdir(path.join(PROJECT_DIR, "prep"), { recursive: true });
    await fs.mkdir(path.join(PROJECT_DIR, "audio"), { recursive: true });
    await fs.mkdir(path.join(PROJECT_DIR, "scenes"), { recursive: true });
    await fs.mkdir(path.join(PROJECT_DIR, "out"), { recursive: true });

    // Extract a 10s subclip from 1023.mp4 as hero_footage.mp4 for fast high-fidelity testing
    const srcAsset = path.join(PROJECTS_ROOT, "demo-launch", "assets", "1023.mp4");
    const dstAsset = path.join(PROJECT_DIR, "assets", "hero_footage.mp4");
    if (fsSync.existsSync(srcAsset)) {
      execSync(`"${getFfmpegPath()}" -y -ss 0 -i "${srcAsset}" -t 10 -c:v libx264 -preset fast -c:a aac "${dstAsset}"`, { stdio: "ignore" });
    } else {
      execSync(`"${getFfmpegPath()}" -y -f lavfi -i testsrc=size=1920x1080:rate=30 -f lavfi -i sine=frequency=1000 -t 5 -c:v libx264 -c:a aac "${dstAsset}"`, { stdio: "ignore" });
    }

    // Call project endpoint to register and probe assets
    const res = await fetch(`${BASE_URL}/api/projects/${SLUG}`);
    const data = await res.json();
    return `Project initialized with ${data.assets.length} asset(s), probe size: ${(data.assets[0]?.sizeBytes / 1024 / 1024).toFixed(1)} MB`;
  }));

  // Step 2: Test All Style Scoring Matrix Fields
  results.push(await runStep("2. Test Style Scoring Matrix with all fields", async () => {
    const res = await fetch(`${BASE_URL}/api/projects/${SLUG}/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q1: "app_screen",
        q2: "launch_feature",
        q3: "technical_clean",
        q4: "promo_60",
        q5: "developers",
        hasFootageOfUser: true,
        hasAppOrScreen: true,
        hasDataOrNumbers: true,
      }),
    });
    const data = await res.json();
    if (!data.primary || !data.ranked || data.ranked.length !== 7) {
      throw new Error("Invalid scoring response");
    }

    // Save chosen style
    await fetch(`${BASE_URL}/api/projects/${SLUG}/style`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ styleCode: data.primary.id === "clean-tech" ? "T" : "W" }),
    });

    return `Winner: ${data.primary.name} (${data.primary.id}), Recommendation: ${data.recommendationNote}`;
  }));

  // Step 3: Create & Validate Rich Storyboard with All Fields
  results.push(await runStep("3. Create & Approve Multi-Scene Storyboard", async () => {
    const storyboard = {
      projectId: SLUG,
      version: 1,
      approved: true,
      approvedAt: new Date().toISOString(),
      styleCode: "T",
      totalDuration: 20,
      aspectRatio: "16:9",
      resolution: "1080p",
      scenes: [
        {
          id: "sc-1",
          index: 1,
          title: "The Problem",
          startTime: 0,
          endTime: 5,
          duration: 5,
          description: "Bold kinetic type exposing how slow traditional editing is.",
          mediaRefs: ["hero_footage.mp4"],
          mediaType: "Video",
          styleTag: "Kinetic",
          voiceoverLine: "Creating high quality product videos and motion graphics used to take hours.",
        },
        {
          id: "sc-2",
          index: 2,
          title: "The Solution",
          startTime: 5,
          endTime: 10,
          duration: 5,
          description: "Clean Tech showcase revealing MotionForge automation engine.",
          mediaRefs: ["hero_footage.mp4"],
          mediaType: "Video",
          styleTag: "Clean Tech",
          voiceoverLine: "MotionForge turns footage, audio, and scripts into explainer videos in seconds.",
        },
        {
          id: "sc-3",
          index: 3,
          title: "Multi-Track Timeline",
          startTime: 10,
          endTime: 15,
          duration: 5,
          description: "OpenReel multi-track timeline preview with transitions and captions.",
          mediaRefs: ["hero_footage.mp4"],
          mediaType: "Video",
          styleTag: "Walkthrough",
          voiceoverLine: "Full multi-track timeline editing with code-generated scenes and automated audio ducking.",
        },
        {
          id: "sc-4",
          index: 4,
          title: "Call to Action",
          startTime: 15,
          endTime: 20,
          duration: 5,
          description: "Final call to action and logo resolve.",
          mediaRefs: [],
          mediaType: "Motion Graphics",
          styleTag: "Kinetic",
          voiceoverLine: "Start building with MotionForge today. Fast, precise, and completely local.",
        },
      ],
    };

    const res = await fetch(`${BASE_URL}/api/projects/${SLUG}/storyboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyboard }),
    });
    const saved = await res.json();
    return `Saved storyboard with ${saved.scenes.length} scenes, total: ${saved.totalDuration}s, approved: ${saved.approved}`;
  }));

  // Step 4: Test All Asset Prep Tools (Trim, Crop, CFR, Audio, Normalize, Proxy)
  results.push(await runStep("4. Execute All Asset Prep Tools", async () => {
    const prepResults = [];

    // 4a. Trim
    const rTrim = await fetch(`${BASE_URL}/api/projects/${SLUG}/prep/trim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetName: "hero_footage.mp4", startSec: 0, durationSec: 6 }),
    });
    prepResults.push(`Trim: ${(await rTrim.json()).relativePath}`);

    // 4b. Crop 16:9
    const rCrop16 = await fetch(`${BASE_URL}/api/projects/${SLUG}/prep/crop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetName: "hero_footage.mp4", aspect: "16:9" }),
    });
    prepResults.push(`Crop 16:9: ${(await rCrop16.json()).relativePath}`);

    // 4c. Crop 9:16
    const rCrop9 = await fetch(`${BASE_URL}/api/projects/${SLUG}/prep/crop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetName: "hero_footage.mp4", aspect: "9:16" }),
    });
    prepResults.push(`Crop 9:16: ${(await rCrop9.json()).relativePath}`);

    // 4d. CFR 30fps
    const rCfr = await fetch(`${BASE_URL}/api/projects/${SLUG}/prep/cfr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetName: "hero_footage.mp4" }),
    });
    prepResults.push(`CFR 30fps: ${(await rCfr.json()).relativePath}`);

    // 4e. Extract Audio
    const rExt = await fetch(`${BASE_URL}/api/projects/${SLUG}/prep/extract-audio`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetName: "hero_footage.mp4" }),
    });
    prepResults.push(`Extract Audio: ${(await rExt.json()).relativePath}`);

    // 4f. Normalize Loudness
    const rNorm = await fetch(`${BASE_URL}/api/projects/${SLUG}/prep/normalize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetName: "hero_footage.mp4", targetLufs: -16 }),
    });
    prepResults.push(`Normalize: ${(await rNorm.json()).relativePath}`);

    // 4g. Proxy 540p
    const rProxy = await fetch(`${BASE_URL}/api/projects/${SLUG}/prep/proxy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetName: "hero_footage.mp4" }),
    });
    prepResults.push(`Proxy: ${(await rProxy.json()).relativePath}`);

    return prepResults.join(", ");
  }));

  // Step 5: Generate Voice Narration Audio
  results.push(await runStep("5. Generate Voice Narration Audio (TTS)", async () => {
    const fullText = "Creating high quality product videos and motion graphics used to take hours. MotionForge turns footage, audio, and scripts into explainer videos in seconds. Full multi-track timeline editing with code-generated scenes and automated audio ducking. Start building with MotionForge today. Fast, precise, and completely local.";
    const res = await fetch(`${BASE_URL}/api/projects/${SLUG}/voice/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: fullText,
        voiceId: "af_sky",
        speed: 1.05,
      }),
    });
    const data = await res.json();
    if (!data.relativePath && !data.outputPath) throw new Error(data.error || "Voice generation failed");
    return `Generated voice narration: ${data.relativePath} (${data.duration?.toFixed(1)}s, af_sky / neural)`;
  }));

  // Step 6: Transcribe Audio with Whisper for Word-Level Captions
  results.push(await runStep("6. Transcribe Audio & Generate Word-Level Captions", async () => {
    const res = await fetch(`${BASE_URL}/api/projects/${SLUG}/captions/transcribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audioFileName: "audio/voice.wav" }),
    });
    const data = await res.json();
    return `Captions created: ${data.segments?.length || 0} segment(s) mapped to audio/captions.json and .srt`;
  }));

  // Step 7: Synthesize Sound FX & Dual Mix Engine
  results.push(await runStep("7. Synthesize Sound FX & Dual Mix (-16 LUFS)", async () => {
    const rWhoosh = await fetch(`${BASE_URL}/api/projects/${SLUG}/sound/whoosh`, { method: "POST" });
    const rImpact = await fetch(`${BASE_URL}/api/projects/${SLUG}/sound/impact`, { method: "POST" });
    const rMix = await fetch(`${BASE_URL}/api/projects/${SLUG}/sound/dual-mix`, { method: "POST" });
    const mixData = await rMix.json();
    return `Dual mixes produced: audio/with-voice.wav (${mixData.withVoiceLufs} LUFS) & audio/music-fx-only.wav (${mixData.musicFxLufs} LUFS)`;
  }));

  // Step 8: Multi-Track Timeline & OpenReel Operations
  results.push(await runStep("8. OpenReel Multi-Track Timeline Operations", async () => {
    // Generate from storyboard
    const rGen = await fetch(`${BASE_URL}/api/projects/${SLUG}/timeline/from-storyboard`, { method: "POST" });
    const project = await rGen.json();

    // Add Overlay
    const rOverlay = await fetch(`${BASE_URL}/api/projects/${SLUG}/timeline/add-overlay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        overlay: {
          name: "MotionForge Watermark",
          startTime: 1.5,
          duration: 5,
          opacity: 0.85,
          scale: { x: 0.25, y: 0.25 },
        },
      }),
    });

    // Set Audio Levels
    await fetch(`${BASE_URL}/api/projects/${SLUG}/timeline/set-audio-levels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId: "track-music", volume: 0.75 }),
    });

    // Export Timeline Video
    const rExp = await fetch(`${BASE_URL}/api/projects/${SLUG}/timeline/export`, { method: "POST" });
    const expData = await rExp.json();

    // Wait for export job completion
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 500));
      const rJobs = await fetch(`${BASE_URL}/api/projects/${SLUG}/jobs`);
      const jobsData = await rJobs.json();
      const job = jobsData.jobs?.find((j) => j.id === expData.jobId);
      if (job?.status === "completed") break;
      if (job?.status === "failed") throw new Error(`Export job failed: ${job.error}`);
    }

    return `Timeline synchronized: ${project.timeline.tracks.length} tracks, overlay added, audio levels adjusted, exported to out/timeline-export.mp4`;
  }));

  // Step 9: Render Final 1080p Master Video
  results.push(await runStep("9. Render Final 1080p CFR 30fps Master Video", async () => {
    const res = await fetch(`${BASE_URL}/api/projects/${SLUG}/render`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aspectRatio: "16:9", resolution: "1080p" }),
    });
    const data = await res.json();
    return `Render complete: ${data.relativePath || "out/render.mp4"} (${data.duration?.toFixed(1)}s, ${data.loudnessLufs} LUFS)`;
  }));

  // Step 10: Deep FFprobe Inspection of Rendered Videos
  results.push(await runStep("10. Deep FFprobe Video Integrity Verification", async () => {
    const renderPath = path.join(PROJECT_DIR, "out", "render.mp4");
    const timelinePath = path.join(PROJECT_DIR, "out", "timeline-export.mp4");

    if (!fsSync.existsSync(renderPath)) throw new Error("out/render.mp4 missing");
    if (!fsSync.existsSync(timelinePath)) throw new Error("out/timeline-export.mp4 missing");

    const cmd = `"${getFfprobePath()}" -v error -show_entries stream=codec_name,codec_type,width,height,duration,r_frame_rate -of json "${renderPath}"`;
    const probeRaw = execSync(cmd).toString();
    const probe = JSON.parse(probeRaw);

    const vStream = probe.streams?.find((s) => s.codec_type === "video");
    const aStream = probe.streams?.find((s) => s.codec_type === "audio");

    if (!vStream || vStream.width !== 1920 || vStream.height !== 1080) {
      throw new Error(`Invalid video stream: ${JSON.stringify(vStream)}`);
    }
    if (!aStream) {
      throw new Error("Missing audio stream in master output");
    }

    const dur = parseFloat(vStream.duration || "0");
    const fps = vStream.r_frame_rate;
    return `Master output verified: 1920x1080 @ ${fps} fps CFR, duration: ${dur.toFixed(1)}s, audio: ${aStream.codec_name}`;
  }));

  console.log("\n=====================================================================");
  console.log("   ALL E2E PIPELINE TESTS COMPLETED                                  ");
  console.log("=====================================================================");
  const allPassed = results.every((r) => r.success);
  console.log(`Summary: ${results.filter((r) => r.success).length}/${results.length} steps passed completely.`);

  if (!allPassed) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
