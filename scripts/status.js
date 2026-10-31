import fs from "node:fs";
import path from "node:path";
import os from "node:os";

async function diagnoseAll() {
  console.log("=== MotionForge Live System Diagnostics ===\n");

  // 1. Backend Server
  try {
    const res = await fetch("http://127.0.0.1:4100/api/health");
    const health = await res.json();
    console.log("[OK] Backend Server: RUNNING on http://127.0.0.1:4100");
    console.log("     Health payload:", JSON.stringify(health));
  } catch (err) {
    console.error("[FAIL] Backend Server:", err.message);
  }

  // 2. Frontend Web App
  try {
    const res = await fetch("http://127.0.0.1:5173/");
    console.log("[OK] Frontend Web App: RUNNING on http://127.0.0.1:5173/ (HTTP " + res.status + ")");
  } catch (err) {
    console.error("[FAIL] Frontend App:", err.message);
  }

  // 3. Inspect Disk Project Folder
  const projDir = path.join(os.homedir(), "MotionForge", "projects", "demo-launch");
  console.log("\n[OK] Project Directory on disk:", projDir);

  const subdirs = ["assets", "prep", "audio", "scenes", "out"];
  for (const sub of subdirs) {
    const subPath = path.join(projDir, sub);
    if (fs.existsSync(subPath)) {
      const files = fs.readdirSync(subPath);
      console.log(`     - ${sub}/ (${files.length} files):`, files.join(", ") || "(empty)");
    } else {
      console.log(`     - ${sub}/: missing`);
    }
  }

  const rootFiles = ["brief.md", "style.json", "storyboard.json"];
  for (const rf of rootFiles) {
    const rfPath = path.join(projDir, rf);
    if (fs.existsSync(rfPath)) {
      const stat = fs.statSync(rfPath);
      console.log(`     - ${rf} exists (${stat.size} bytes)`);
    }
  }

  // Read storyboard approval state
  const sbPath = path.join(projDir, "storyboard.json");
  if (fs.existsSync(sbPath)) {
    const sb = JSON.parse(fs.readFileSync(sbPath, "utf8"));
    console.log("     - Storyboard approved:", sb.approved, "at", sb.approvedAt);
    console.log("     - Scenes count:", sb.scenes.length, "Total duration:", sb.totalDuration + "s");
  }

  // 4. Test WebSocket endpoint
  console.log("\n[OK] Testing WebSocket connection...");
  try {
    const { WebSocket } = await import("ws");
    const ws = new WebSocket("ws://127.0.0.1:4100/ws");
    await new Promise((resolve, reject) => {
      ws.on("open", () => {
        console.log("     - WebSocket handshake succeeded!");
        ws.close();
        resolve(true);
      });
      ws.on("error", reject);
      setTimeout(() => reject(new Error("Timeout")), 2000);
    });
  } catch (err) {
    console.error("     - WebSocket error:", err.message);
  }
}

diagnoseAll().catch(console.error);
