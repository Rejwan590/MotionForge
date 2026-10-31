import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  AssetMeta,
  ProjectState,
  Storyboard,
  createDefaultStoryboard,
  StyleCode,
} from "@motionforge/core";
import { getProjectDir, isSafePath } from "./config.js";
import { probeMedia, generateThumbnail } from "./ffmpeg.js";

export interface ProjectFileEntry {
  name: string;
  relativePath: string;
  sizeBytes: number;
  sizeFormatted: string;
  status: string;
  modifiedAt: string;
  isDir: boolean;
}

export async function ensureProject(slug: string = "demo-launch"): Promise<ProjectState> {
  const dir = getProjectDir(slug);
  const subdirs = ["assets", "prep", "audio", "scenes", "out", ".thumbs"];

  for (const sub of subdirs) {
    await fs.mkdir(path.join(dir, sub), { recursive: true });
  }

  const briefPath = path.join(dir, "brief.md");
  if (!fsSync.existsSync(briefPath)) {
    const defaultBrief = `# MotionForge Project: ${slug}\n\nGoal: Build a high-impact explainer video.\nCreated: ${new Date().toISOString()}\n`;
    await fs.writeFile(briefPath, defaultBrief, "utf-8");
  }

  const stylePath = path.join(dir, "style.json");
  if (!fsSync.existsSync(stylePath)) {
    await fs.writeFile(
      stylePath,
      JSON.stringify({ styleCode: "T", updatedAt: new Date().toISOString() }, null, 2),
      "utf-8"
    );
  }

  const storyboardPath = path.join(dir, "storyboard.json");
  let storyboard: Storyboard;
  if (!fsSync.existsSync(storyboardPath)) {
    storyboard = createDefaultStoryboard(slug, "Product Explainer", "T");
    await fs.writeFile(storyboardPath, JSON.stringify(storyboard, null, 2), "utf-8");
  } else {
    try {
      const raw = await fs.readFile(storyboardPath, "utf-8");
      storyboard = JSON.parse(raw);
    } catch {
      storyboard = createDefaultStoryboard(slug, "Product Explainer", "T");
    }
  }

  const assets = await listAssets(slug);

  let styleCode: StyleCode = "T";
  try {
    const rawStyle = await fs.readFile(stylePath, "utf-8");
    const parsed = JSON.parse(rawStyle);
    if (parsed.styleCode) styleCode = parsed.styleCode;
  } catch {}

  const state: ProjectState = {
    id: slug,
    name: slug === "demo-launch" ? "Project-Demo-Launch" : slug,
    slug,
    path: dir,
    phase: storyboard.approved ? 2 : 1,
    phaseName: storyboard.approved ? "Phase 2: Assets & Voice" : "Phase 1: Storyboard",
    updatedAt: new Date().toISOString(),
    assets,
    storyboard,
    styleCode,
    voiceSettings: {
      mode: "ai-voice",
      voiceId: "kokoro-en",
      speed: 1.0,
      autoCaptions: true,
      backgroundMusic: true,
      soundEffects: true,
    },
  };

  return state;
}

export async function listAssets(slug: string): Promise<AssetMeta[]> {
  const dir = getProjectDir(slug);
  const assetsDir = path.join(dir, "assets");
  const thumbsDir = path.join(dir, ".thumbs");

  try {
    const entries = await fs.readdir(assetsDir, { withFileTypes: true });
    const assets: AssetMeta[] = [];

    for (const ent of entries) {
      if (!ent.isFile()) continue;
      const fullPath = path.join(assetsDir, ent.name);
      const thumbName = `${path.parse(ent.name).name}_thumb.jpg`;
      const thumbPath = path.join(thumbsDir, thumbName);

      // Probe media
      const probe = await probeMedia(fullPath);

      // Ensure thumbnail exists
      let hasThumb = fsSync.existsSync(thumbPath);
      if (!hasThumb && (probe.hasVideo || probe.format.match(/jpg|jpeg|png|webp|gif/i))) {
        hasThumb = await generateThumbnail(fullPath, thumbPath, 0.5);
      }

      const ext = path.extname(ent.name).toLowerCase();
      let type: AssetMeta["type"] = "other";
      if ([".mp4", ".mov", ".webm", ".avi", ".mkv"].includes(ext)) type = "video";
      else if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(ext)) type = "image";
      else if ([".mp3", ".wav", ".aac", ".m4a", ".ogg"].includes(ext)) type = "audio";
      else if ([".csv", ".json", ".txt", ".md"].includes(ext)) type = "document";

      assets.push({
        id: crypto.createHash("md5").update(ent.name).digest("hex").slice(0, 8),
        name: ent.name,
        originalName: ent.name,
        path: fullPath,
        relativePath: `assets/${ent.name}`,
        sizeBytes: probe.sizeBytes,
        mimeType: probe.format,
        type,
        durationSeconds: probe.durationSeconds || undefined,
        width: probe.width,
        height: probe.height,
        fps: probe.fps,
        thumbnailUrl: hasThumb ? `/api/projects/${slug}/thumbnails/${thumbName}` : undefined,
        hasAudio: probe.hasAudio,
        createdAt: new Date().toISOString(),
      });
    }

    return assets;
  } catch {
    return [];
  }
}

export async function saveUploadedAsset(
  slug: string,
  filename: string,
  buffer: Buffer
): Promise<AssetMeta> {
  const dir = getProjectDir(slug);
  const assetsDir = path.join(dir, "assets");
  const thumbsDir = path.join(dir, ".thumbs");

  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const destPath = path.join(assetsDir, sanitized);

  await fs.writeFile(destPath, buffer);

  const probe = await probeMedia(destPath);
  const thumbName = `${path.parse(sanitized).name}_thumb.jpg`;
  const thumbPath = path.join(thumbsDir, thumbName);
  let hasThumb = false;
  if (probe.hasVideo || probe.format.match(/jpg|jpeg|png|webp|gif/i)) {
    hasThumb = await generateThumbnail(destPath, thumbPath, 0.5);
  }

  const ext = path.extname(sanitized).toLowerCase();
  let type: AssetMeta["type"] = "other";
  if ([".mp4", ".mov", ".webm", ".avi"].includes(ext)) type = "video";
  else if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(ext)) type = "image";
  else if ([".mp3", ".wav", ".aac"].includes(ext)) type = "audio";
  else if ([".csv", ".json", ".txt", ".md"].includes(ext)) type = "document";

  return {
    id: crypto.createHash("md5").update(sanitized).digest("hex").slice(0, 8),
    name: sanitized,
    originalName: filename,
    path: destPath,
    relativePath: `assets/${sanitized}`,
    sizeBytes: buffer.length,
    mimeType: probe.format,
    type,
    durationSeconds: probe.durationSeconds || undefined,
    width: probe.width,
    height: probe.height,
    fps: probe.fps,
    thumbnailUrl: hasThumb ? `/api/projects/${slug}/thumbnails/${thumbName}` : undefined,
    hasAudio: probe.hasAudio,
    createdAt: new Date().toISOString(),
  };
}

export async function removeAsset(slug: string, assetName: string): Promise<boolean> {
  const dir = getProjectDir(slug);
  const filePath = path.join(dir, "assets", assetName);
  if (!isSafePath(dir, filePath)) {
    throw new Error("Invalid asset path");
  }
  if (fsSync.existsSync(filePath)) {
    await fs.unlink(filePath);
  }
  const thumbPath = path.join(dir, ".thumbs", `${path.parse(assetName).name}_thumb.jpg`);
  if (fsSync.existsSync(thumbPath)) {
    await fs.unlink(thumbPath);
  }
  return true;
}

export async function saveStoryboard(slug: string, storyboard: Storyboard): Promise<Storyboard> {
  const dir = getProjectDir(slug);
  const filePath = path.join(dir, "storyboard.json");
  await fs.writeFile(filePath, JSON.stringify(storyboard, null, 2), "utf-8");
  return storyboard;
}

export async function saveStyle(slug: string, styleCode: StyleCode): Promise<void> {
  const dir = getProjectDir(slug);
  const filePath = path.join(dir, "style.json");
  await fs.writeFile(
    filePath,
    JSON.stringify({ styleCode, updatedAt: new Date().toISOString() }, null, 2),
    "utf-8"
  );
}

export async function listProjectFiles(slug: string): Promise<ProjectFileEntry[]> {
  const dir = getProjectDir(slug);
  const results: ProjectFileEntry[] = [];

  async function walk(currentDir: string, relativePrefix: string = "") {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.name.startsWith(".")) continue; // skip hidden folders like .thumbs
      const full = path.join(currentDir, ent.name);
      const rel = path.join(relativePrefix, ent.name).replace(/\\/g, "/");
      const stat = await fs.stat(full);

      let status = "Synced";
      if (rel.includes("out/") || rel.endsWith(".mp4")) {
        status = "Pending";
      } else if (rel.endsWith("storyboard.json") || rel.endsWith("style.json")) {
        status = "Ready";
      }

      results.push({
        name: ent.name + (ent.isDirectory() ? "/" : ""),
        relativePath: rel,
        sizeBytes: stat.size,
        sizeFormatted: formatBytes(stat.size),
        status,
        modifiedAt: formatRelativeTime(stat.mtime),
        isDir: ent.isDirectory(),
      });

      if (ent.isDirectory() && relativePrefix === "") {
        // Walk one level deep into subdirs like assets/
        await walk(full, ent.name);
      }
    }
  }

  await walk(dir);
  return results;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffSec = Math.floor((now - date.getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hr ago`;
  return `${Math.floor(diffSec / 86400)} d ago`;
}
