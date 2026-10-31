import React, { useState } from "react";
import {
  Film,
  Download,
  Play,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  Settings,
  HardDrive,
  Cpu,
  Volume2,
} from "lucide-react";

interface RenderWorkspaceProps {
  projectSlug: string;
  onBackToTimeline: () => void;
}

export function RenderWorkspace({
  projectSlug,
  onBackToTimeline,
}: RenderWorkspaceProps) {
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [resolution, setResolution] = useState<"1080p" | "4K" | "720p">("1080p");
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Ready to render");
  const [renderResult, setRenderResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStartRender = async () => {
    try {
      setRendering(true);
      setError(null);
      setProgress(10);
      setStatusText("Generating project brief and scenes code...");

      const res = await fetch(`http://127.0.0.1:4100/api/projects/${projectSlug}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aspectRatio, resolution }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      setProgress(100);
      setStatusText("Final render multiplexed successfully!");
      setRenderResult(data);
    } catch (err: any) {
      setError(err.message || "Render failed");
      setStatusText("Render error");
    } finally {
      setRendering(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 font-sans text-text">
      {/* Top Banner */}
      <div className="bg-panel border border-border rounded-lg p-4 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text">
              HyperFrames Final 1080p Production Render
            </h2>
            <p className="text-xs text-text-dim">
              Multiplexes code-generated motion graphics scenes, dual audio mix, and timeline overlays.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBackToTimeline}
            className="px-3 py-1.5 rounded bg-panel-2 hover:bg-border text-xs font-medium text-text-dim border border-border transition-colors"
          >
            ← Back to Timeline Editor
          </button>
          <button
            onClick={handleStartRender}
            disabled={rendering}
            className="flex items-center gap-2 px-4 py-2 rounded bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{rendering ? "Rendering..." : "Render Final 1080p MP4"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-lg p-3 text-xs text-danger flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-danger" />
          <span>{error}</span>
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-12 gap-4">
        {/* Render Specs Card */}
        <div className="col-span-12 lg:col-span-5 bg-panel border border-border rounded-lg p-4 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Settings className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-dim">
              Export Configuration
            </h3>
          </div>

          <div>
            <label className="text-xs font-semibold text-text block mb-2">
              Aspect Ratio
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["16:9", "9:16", "1:1"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setAspectRatio(r)}
                  className={`py-2 px-3 rounded text-xs font-medium border text-center transition-all ${
                    aspectRatio === r
                      ? "bg-primary/20 border-primary text-white shadow-xs"
                      : "bg-panel-2 border-border text-text-dim hover:bg-border"
                  }`}
                >
                  {r === "16:9" ? "16:9 (Landscape)" : r === "9:16" ? "9:16 (Shorts)" : "1:1 (Square)"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text block mb-2">
              Master Resolution
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["1080p", "4K", "720p"] as const).map((res) => (
                <button
                  key={res}
                  onClick={() => setResolution(res)}
                  className={`py-2 px-3 rounded text-xs font-medium border text-center transition-all ${
                    resolution === res
                      ? "bg-primary/20 border-primary text-white shadow-xs"
                      : "bg-panel-2 border-border text-text-dim hover:bg-border"
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-panel-2 border border-border/80 rounded p-3 text-xs flex flex-col gap-2">
            <div className="flex items-center justify-between text-text-faint text-[11px]">
              <span>Framerate & Mode</span>
              <span className="text-text font-mono font-medium">30 fps CFR (-fps_mode cfr)</span>
            </div>
            <div className="flex items-center justify-between text-text-faint text-[11px]">
              <span>Audio Mixing</span>
              <span className="text-text font-mono font-medium">Dual Mix (-16.0 LUFS EBU R128)</span>
            </div>
            <div className="flex items-center justify-between text-text-faint text-[11px]">
              <span>Video Framework</span>
              <span className="text-text font-mono font-medium">HyperFrames HTML-to-MP4</span>
            </div>
          </div>
        </div>

        {/* Live Output & Video Player Card */}
        <div className="col-span-12 lg:col-span-7 bg-panel border border-border rounded-lg p-4 flex flex-col items-center justify-between shadow-sm min-h-[360px]">
          <div className="w-full flex items-center justify-between pb-2 border-b border-border">
            <span className="text-xs font-bold uppercase tracking-wider text-text-dim flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-primary" />
              Master Video Output
            </span>
            <span className="text-xs text-text-faint font-mono">
              out/render.mp4
            </span>
          </div>

          {/* Video Preview Canvas */}
          <div className="w-full flex-1 my-3 bg-black rounded border border-border/60 flex items-center justify-center relative overflow-hidden">
            {renderResult?.outputFile || renderResult?.url ? (
              <video
                controls
                className="max-h-[260px] w-auto rounded shadow-lg"
                src={`http://127.0.0.1:4100${renderResult.url || `/api/projects/${projectSlug}/files/out/render.mp4`}`}
              />
            ) : (
              <div className="flex flex-col items-center text-center p-6 gap-2">
                <div className="w-12 h-12 rounded-full bg-panel-2 border border-border flex items-center justify-center text-text-faint">
                  <Film className="w-6 h-6" />
                </div>
                <div className="text-xs font-medium text-text">
                  {statusText}
                </div>
                {rendering && (
                  <div className="w-48 bg-panel-2 h-1.5 rounded-full overflow-hidden mt-2 border border-border">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Info & Download */}
          <div className="w-full flex items-center justify-between pt-2 border-t border-border">
            <div className="text-xs text-text-faint">
              {renderResult ? (
                <span className="text-success font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Render Complete • {renderResult.aspectRatio || aspectRatio} • {renderResult.resolution || resolution}
                </span>
              ) : (
                <span>Ready to execute render pipeline</span>
              )}
            </div>

            <a
              href={`http://127.0.0.1:4100/api/projects/${projectSlug}/files/out/render.mp4`}
              download="render.mp4"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-panel-2 hover:bg-border text-xs font-semibold text-text border border-border transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              <span>Download MP4</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
