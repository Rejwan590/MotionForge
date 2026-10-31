import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

console.log("Launching MotionForge Electron Desktop App...");
const electronExe = path.resolve("apps", "desktop", "node_modules", "electron", "dist", "electron.exe");
const mainPath = path.resolve("apps", "desktop", "dist", "main.js");

if (!fs.existsSync(electronExe)) {
  console.error("electron.exe not found at:", electronExe);
  process.exit(1);
}

const proc = spawn(electronExe, [mainPath], {
  stdio: "inherit",
});

setTimeout(() => {
  console.log("Electron desktop process is alive and healthy. Sending kill signal...");
  proc.kill();
  console.log("Electron desktop smoke test passed!");
  process.exit(0);
}, 3000);
