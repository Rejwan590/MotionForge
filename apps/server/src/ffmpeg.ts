import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import os from "node:os";

function getFfmpegBinPath(binaryName: "ffmpeg" | "ffprobe"): string {
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
    `${binaryName}.exe`
  );
  if (fsSync.existsSync(wingetDir)) {
    return wingetDir;
  }
  return binaryName;
}

export interface MediaProbeResult {
  durationSeconds: number;
  width?: number;
  height?: number;
  fps?: number;
  format: string;
  hasAudio: boolean;
  hasVideo: boolean;
  sizeBytes: number;
}

export async function probeMedia(filePath: string): Promise<MediaProbeResult> {
  const stat = await fs.stat(filePath);
  return new Promise((resolve, reject) => {
    const ffprobe = spawn(getFfmpegBinPath("ffprobe"), [
      "-v", "quiet",
      "-print_format", "json",
      "-show_format",
      "-show_streams",
      filePath,
    ]);

    let stdout = "";
    let stderr = "";

    ffprobe.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    ffprobe.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    ffprobe.on("close", (code) => {
      if (code !== 0) {
        // Fallback for non-media files
        return resolve({
          durationSeconds: 0,
          format: path.extname(filePath).slice(1),
          hasAudio: false,
          hasVideo: false,
          sizeBytes: stat.size,
        });
      }

      try {
        const parsed = JSON.parse(stdout);
        const videoStream = parsed.streams?.find((s: { codec_type: string }) => s.codec_type === "video");
        const audioStream = parsed.streams?.find((s: { codec_type: string }) => s.codec_type === "audio");

        let fps = 0;
        if (videoStream?.r_frame_rate) {
          const parts = videoStream.r_frame_rate.split("/");
          if (parts.length === 2 && Number(parts[1]) > 0) {
            fps = Math.round(Number(parts[0]) / Number(parts[1]));
          }
        }

        const duration = parseFloat(parsed.format?.duration || videoStream?.duration || audioStream?.duration || "0");

        resolve({
          durationSeconds: isNaN(duration) ? 0 : duration,
          width: videoStream?.width,
          height: videoStream?.height,
          fps: fps || undefined,
          format: parsed.format?.format_name || path.extname(filePath).slice(1),
          hasAudio: Boolean(audioStream),
          hasVideo: Boolean(videoStream),
          sizeBytes: stat.size,
        });
      } catch (err) {
        resolve({
          durationSeconds: 0,
          format: path.extname(filePath).slice(1),
          hasAudio: false,
          hasVideo: false,
          sizeBytes: stat.size,
        });
      }
    });

    ffprobe.on("error", () => {
      resolve({
        durationSeconds: 0,
        format: path.extname(filePath).slice(1),
        hasAudio: false,
        hasVideo: false,
        sizeBytes: stat.size,
      });
    });
  });
}

export async function generateThumbnail(
  inputPath: string,
  outputPath: string,
  timestampSeconds: number = 0.5
): Promise<boolean> {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  return new Promise((resolve) => {
    // For images, simple resize
    const ext = path.extname(inputPath).toLowerCase();
    const isImage = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"].includes(ext);

    const args = isImage
      ? [
          "-y",
          "-i", inputPath,
          "-vf", "scale=160:-1",
          "-vframes", "1",
          outputPath,
        ]
      : [
          "-y",
          "-ss", String(timestampSeconds),
          "-i", inputPath,
          "-vf", "scale=160:-1",
          "-vframes", "1",
          outputPath,
        ];

    const proc = spawn(getFfmpegBinPath("ffmpeg"), args);

    proc.on("close", (code) => {
      resolve(code === 0);
    });

    proc.on("error", () => {
      resolve(false);
    });
  });
}
