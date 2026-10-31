import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

export const PORT = Number(process.env.PORT) || 4100;
export const HOST = "127.0.0.1";

// Projects directory in ~/MotionForge/projects
export const PROJECTS_ROOT = path.join(os.homedir(), "MotionForge", "projects");

export const SESSION_TOKEN = process.env.MF_SESSION_TOKEN || crypto.randomBytes(16).toString("hex");

export function getProjectDir(slug: string): string {
  // Prevent directory traversal
  const sanitized = slug.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!sanitized) {
    throw new Error("Invalid project slug");
  }
  return path.join(PROJECTS_ROOT, sanitized);
}

export function isSafePath(baseDir: string, targetPath: string): boolean {
  const relative = path.relative(baseDir, targetPath);
  return !relative.startsWith("..") && !path.isAbsolute(relative);
}
