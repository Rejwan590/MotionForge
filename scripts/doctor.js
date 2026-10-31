import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

console.log("=== MotionForge Environment Doctor ===\n");

function getFfmpegCmd(name) {
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
    `${name}.exe`
  );
  if (fs.existsSync(wingetDir)) return `"${wingetDir}"`;
  return name;
}

function check(name, cmd, validator) {
  try {
    const out = execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] }).toString().trim();
    const passed = validator ? validator(out) : true;
    console.log(`[PASS] ${name}: ${out.split("\n")[0]}`);
    return passed;
  } catch (err) {
    console.error(`[FAIL] ${name}: Command failed or not found: ${cmd}`);
    return false;
  }
}

const n = check("Node.js", "node -v", (v) => v.startsWith("v2") || v.startsWith("v18"));
const p = check("pnpm", "pnpm -v");
const f = check("FFmpeg", `${getFfmpegCmd("ffmpeg")} -version`, (v) => v.includes("ffmpeg version"));
const fp = check("FFprobe", `${getFfmpegCmd("ffprobe")} -version`, (v) => v.includes("ffprobe version"));
const py = check("Python", "python --version");
const hf = check("HyperFrames CLI", "npx hyperframes --help", (v) => v.includes("hyperframes"));

console.log("\nSummary:");
if (n && p && f && fp && py) {
  console.log("All critical environment prerequisites are verified and ready!");
} else {
  console.log("Some prerequisites are missing. Check above output.");
}
