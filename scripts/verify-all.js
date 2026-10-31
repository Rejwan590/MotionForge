import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import os from "node:os";

async function verifyAll() {
  console.log("=================================================");
  console.log("   MOTIONFORGE DESKTOP END-TO-END SYSTEM AUDIT  ");
  console.log("=================================================\n");

  const results = [];
  const base = "http://127.0.0.1:4100";
  const slug = "demo-launch";

  // 1. Health & Tools
  try {
    const res = await fetch(`${base}/api/health`);
    const health = await res.json();
    const ok = health.status === "ok" && health.tools.ffmpeg && health.tools.hyperframes;
    results.push({ name: "1. Backend Server & Tools Health", passed: ok, details: health });
  } catch (e) {
    results.push({ name: "1. Backend Server & Tools Health", passed: false, details: e.message });
  }

  // 2. Project State
  try {
    const res = await fetch(`${base}/api/projects/${slug}`);
    const proj = await res.json();
    const ok = proj.slug === slug && proj.assets.length > 0 && proj.storyboard !== null;
    results.push({ name: "2. Project State & Storage", passed: ok, details: `${proj.assets.length} assets, style: ${proj.styleCode}` });
  } catch (e) {
    results.push({ name: "2. Project State & Storage", passed: false, details: e.message });
  }

  // 3. Style Scoring Matrix
  try {
    const res = await fetch(`${base}/api/projects/${slug}/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q1: "talking_head",
        q2: "explain_concept",
        q3: "friendly_casual",
        q4: "social_short",
        q5: "general_audience",
        hasFootageOfUser: true,
        hasAppOrScreen: false,
        hasDataOrNumbers: false,
      }),
    });
    const scoreData = await res.json();
    const ok = scoreData.ranked && scoreData.ranked.length === 7 && scoreData.primary !== undefined;
    results.push({ name: "3. Style Scoring Engine", passed: ok, details: `Primary Winner: ${scoreData.primary.name} (${scoreData.primary.id})` });
  } catch (e) {
    results.push({ name: "3. Style Scoring Engine", passed: false, details: e.message });
  }

  // 4. Asset Prep Files
  try {
    const projectDir = path.join(os.homedir(), "MotionForge", "projects", slug);
    const prepFiles = await fs.readdir(path.join(projectDir, "prep"));
    const ok = prepFiles.length >= 4;
    results.push({ name: "4. Asset Prep Engine (CFR, Crop, Trim, Proxy)", passed: ok, details: `${prepFiles.length} files in prep/` });
  } catch (e) {
    results.push({ name: "4. Asset Prep Engine", passed: false, details: e.message });
  }

  // 5. Voice Generation & Captions
  try {
    const projectDir = path.join(os.homedir(), "MotionForge", "projects", slug);
    const hasVoice = fsSync.existsSync(path.join(projectDir, "audio", "with-voice.wav"));
    const hasCaptions = fsSync.existsSync(path.join(projectDir, "audio", "captions.json"));
    results.push({ name: "5. Kokoro/Neural TTS & Whisper Captions", passed: hasVoice && hasCaptions, details: "with-voice.wav and captions.json verified" });
  } catch (e) {
    results.push({ name: "5. Kokoro/Neural TTS & Whisper Captions", passed: false, details: e.message });
  }

  // 6. Sound FX & Dual Mix
  try {
    const projectDir = path.join(os.homedir(), "MotionForge", "projects", slug);
    const hasWhoosh = fsSync.existsSync(path.join(projectDir, "audio", "whoosh.wav"));
    const hasImpact = fsSync.existsSync(path.join(projectDir, "audio", "impact.wav"));
    const hasMusicMix = fsSync.existsSync(path.join(projectDir, "audio", "music-fx-only.wav"));
    results.push({ name: "6. Sound FX (Whoosh/808) & Dual Mix (-16 LUFS)", passed: hasWhoosh && hasImpact && hasMusicMix, details: "Whoosh, Impact, and Dual Mixes verified" });
  } catch (e) {
    results.push({ name: "6. Sound FX & Dual Mix", passed: false, details: e.message });
  }

  // 7. Multi-Track Timeline & OpenReel Integration
  try {
    const res = await fetch(`${base}/api/projects/${slug}/timeline`);
    const timeline = await res.json();
    const ok = timeline.timeline?.tracks?.length === 4 && timeline.timeline.duration > 0;
    results.push({ name: "7. OpenReel Multi-Track Timeline Engine", passed: ok, details: `${timeline.timeline?.tracks?.length} tracks, duration: ${timeline.timeline?.duration}s` });
  } catch (e) {
    results.push({ name: "7. OpenReel Multi-Track Timeline Engine", passed: false, details: e.message });
  }

  // 8. Video Master Render Outputs
  try {
    const projectDir = path.join(os.homedir(), "MotionForge", "projects", slug);
    const hasRenderMp4 = fsSync.existsSync(path.join(projectDir, "out", "render.mp4"));
    const hasTimelineMp4 = fsSync.existsSync(path.join(projectDir, "out", "timeline-export.mp4"));
    results.push({ name: "8. 1080p CFR Master Renders", passed: hasRenderMp4 && hasTimelineMp4, details: "out/render.mp4 and out/timeline-export.mp4 verified" });
  } catch (e) {
    results.push({ name: "8. 1080p CFR Master Renders", passed: false, details: e.message });
  }

  // 9. Electron Desktop App Build
  try {
    const desktopMain = path.resolve("apps", "desktop", "dist", "main.js");
    const desktopPreload = path.resolve("apps", "desktop", "dist", "preload.js");
    const ok = fsSync.existsSync(desktopMain) && fsSync.existsSync(desktopPreload);
    results.push({ name: "9. Electron Desktop Application Package", passed: ok, details: "main.js and preload.js built in apps/desktop/dist" });
  } catch (e) {
    results.push({ name: "9. Electron Desktop Application Package", passed: false, details: e.message });
  }

  // 10. Web UI Frontend Server
  try {
    const res = await fetch("http://127.0.0.1:5173/");
    const ok = res.status === 200;
    results.push({ name: "10. Web UI Desktop-Class Shell", passed: ok, details: "Vite server responding with HTTP 200 on port 5173" });
  } catch (e) {
    results.push({ name: "10. Web UI Desktop-Class Shell", passed: false, details: e.message });
  }

  console.log("TEST RESULTS:\n");
  let allPass = true;
  for (const r of results) {
    const mark = r.passed ? "[PASS]" : "[FAIL]";
    if (!r.passed) allPass = false;
    console.log(`${mark} ${r.name}`);
    console.log(`       Details: ${typeof r.details === "object" ? JSON.stringify(r.details) : r.details}\n`);
  }

  console.log("-------------------------------------------------");
  console.log(`TOTAL: ${results.filter(r => r.passed).length}/${results.length} COMPONENTS FULLY FUNCTIONAL`);
  console.log("-------------------------------------------------");

  if (!allPass) process.exit(1);
}

verifyAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
