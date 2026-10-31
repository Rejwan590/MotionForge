import { projectWatcher } from "./websocket.js";

export type JobType =
  | "trim"
  | "crop"
  | "cfr"
  | "extract_audio"
  | "normalize"
  | "proxy"
  | "voice_gen"
  | "transcribe"
  | "sfx_whoosh"
  | "sfx_impact"
  | "dual_mix"
  | "render"
  | "timeline_export";

export interface Job {
  id: string;
  projectSlug: string;
  type: JobType;
  title: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  progress: number; // 0 - 100
  logs: string[];
  resultFile?: string;
  error?: string;
  startedAt: string;
  completedAt?: string;
  cancelFn?: () => void;
}

class JobManager {
  private jobs = new Map<string, Job>();

  createJob(projectSlug: string, type: JobType, title: string): Job {
    const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const job: Job = {
      id,
      projectSlug,
      type,
      title,
      status: "queued",
      progress: 0,
      logs: [`[${new Date().toLocaleTimeString()}] Queued job: ${title}`],
      startedAt: new Date().toISOString(),
    };
    this.jobs.set(id, job);
    this.broadcast(job);
    return job;
  }

  getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  listJobs(projectSlug?: string): Job[] {
    const list = Array.from(this.jobs.values());
    if (projectSlug) {
      return list.filter((j) => j.projectSlug === projectSlug);
    }
    return list;
  }

  updateProgress(id: string, progress: number, logMessage?: string) {
    const job = this.jobs.get(id);
    if (!job) return;
    job.status = "running";
    job.progress = Math.min(100, Math.max(0, Math.round(progress)));
    if (logMessage) {
      const line = `[${new Date().toLocaleTimeString()}] ${logMessage}`;
      job.logs.push(line);
      projectWatcher.emitLog(logMessage, "server");
    }
    this.broadcast(job);
  }

  completeJob(id: string, resultFile?: string, summaryLog?: string) {
    const job = this.jobs.get(id);
    if (!job) return;
    job.status = "completed";
    job.progress = 100;
    job.resultFile = resultFile;
    job.completedAt = new Date().toISOString();
    if (summaryLog) {
      job.logs.push(`[${new Date().toLocaleTimeString()}] ${summaryLog}`);
      projectWatcher.emitLog(summaryLog, "server");
    }
    this.broadcast(job);
  }

  failJob(id: string, error: string) {
    const job = this.jobs.get(id);
    if (!job) return;
    job.status = "failed";
    job.error = error;
    job.completedAt = new Date().toISOString();
    job.logs.push(`[${new Date().toLocaleTimeString()}] ERROR: ${error}`);
    projectWatcher.emitLog(`Job failed (${job.title}): ${error}`, "server");
    this.broadcast(job);
  }

  cancelJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job || job.status === "completed" || job.status === "failed") {
      return false;
    }
    if (job.cancelFn) {
      try {
        job.cancelFn();
      } catch {}
    }
    job.status = "cancelled";
    job.completedAt = new Date().toISOString();
    job.logs.push(`[${new Date().toLocaleTimeString()}] Job cancelled by user`);
    projectWatcher.emitLog(`Job cancelled: ${job.title}`, "server");
    this.broadcast(job);
    return true;
  }

  private broadcast(job: Job) {
    projectWatcher.broadcast({
      type: "job_update",
      job: {
        id: job.id,
        projectSlug: job.projectSlug,
        type: job.type,
        title: job.title,
        status: job.status,
        progress: job.progress,
        logs: job.logs.slice(-20),
        resultFile: job.resultFile,
        error: job.error,
        completedAt: job.completedAt,
      },
    });
  }
}

export const jobManager = new JobManager();
