import { WebSocket } from "ws";
import chokidar, { FSWatcher } from "chokidar";
import { getProjectDir } from "./config.js";

export class ProjectWatcher {
  private sockets = new Set<WebSocket>();
  private watcher: FSWatcher | null = null;
  private currentSlug: string | null = null;

  register(ws: WebSocket) {
    this.sockets.add(ws);
    ws.on("close", () => this.sockets.delete(ws));

    // Send initial greeting / health check
    ws.send(
      JSON.stringify({
        type: "connected",
        timestamp: new Date().toISOString(),
        message: "MotionForge live bridge established",
      })
    );
  }

  watchProject(slug: string) {
    if (this.currentSlug === slug && this.watcher) return;
    if (this.watcher) {
      this.watcher.close();
    }
    this.currentSlug = slug;
    const projectDir = getProjectDir(slug);

    this.watcher = chokidar.watch(projectDir, {
      ignored: /(^|[\/\\])\..|node_modules/,
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher.on("all", (event, filePath) => {
      this.broadcast({
        type: "file_change",
        event,
        filePath,
        timestamp: new Date().toISOString(),
      });
    });
  }

  broadcast(data: unknown) {
    const payload = JSON.stringify(data);
    for (const ws of this.sockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }

  emitLog(message: string, source: "agent" | "server" | "ffmpeg" = "agent") {
    this.broadcast({
      type: "log",
      timestamp: new Date().toLocaleTimeString(),
      source,
      message,
    });
  }
}

export const projectWatcher = new ProjectWatcher();
