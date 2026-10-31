import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Layers,
  Scissors,
  Plus,
  Download,
  Film,
  Music,
  Mic,
  Type,
  Sparkles,
  Eye,
  Trash2,
  Sliders,
  CheckCircle2,
  RefreshCw,
  MoveRight,
} from "lucide-react";
import type { OpenReelProject, Track, Clip, Subtitle } from "@motionforge/timeline-adapter";

interface TimelineEditorProps {
  slug: string;
}

export function TimelineEditor({ slug }: TimelineEditorProps) {
  const [project, setProject] = useState<OpenReelProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string>("track-video");
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1); // pixels per second multiplier
  const [showAddOverlayModal, setShowAddOverlayModal] = useState(false);
  const [newOverlayName, setNewOverlayName] = useState("Brand Watermark");
  const [newOverlayStartTime, setNewOverlayStartTime] = useState(2);
  const [newOverlayDuration, setNewOverlayDuration] = useState(4);
  const [newOverlayOpacity, setNewOverlayOpacity] = useState(0.9);

  // Fetch timeline from server
  const loadTimeline = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://127.0.0.1:4100/api/projects/${slug}/timeline`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
        if (data.timeline.tracks[0]?.clips[0]) {
          setSelectedClip(data.timeline.tracks[0].clips[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load timeline", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();

    // Listen to WebSocket updates
    const ws = new WebSocket("ws://127.0.0.1:4100/ws");
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "file_change" && msg.path?.includes("timeline")) {
          loadTimeline();
        }
      } catch {}
    };

    return () => ws.close();
  }, [slug]);

  // Playhead simulation timer
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const totalDur = project?.timeline?.duration || 28;
          if (prev >= totalDur) {
            setIsPlaying(false);
            return 0;
          }
          return Number((prev + 0.1).toFixed(2));
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, project]);

  const handleOpenInTimeline = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://127.0.0.1:4100/api/projects/${slug}/timeline/from-storyboard`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setProject(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTrimClip = async (clipId: string, inPoint: number, outPoint: number) => {
    try {
      const res = await fetch(`http://127.0.0.1:4100/api/projects/${slug}/timeline/trim-clip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clipId, inPoint, outPoint }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedClip(updated);
        await loadTimeline();
      }
    } catch (err) {
      console.error("Trim failed", err);
    }
  };

  const handleAddOverlay = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:4100/api/projects/${slug}/timeline/add-overlay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newOverlayName,
          startTime: newOverlayStartTime,
          duration: newOverlayDuration,
          opacity: newOverlayOpacity,
          scale: { x: 0.3, y: 0.3 },
          position: { x: 0.7, y: 0.15 },
        }),
      });
      if (res.ok) {
        setShowAddOverlayModal(false);
        await loadTimeline();
      }
    } catch (err) {
      console.error("Overlay creation failed", err);
    }
  };

  const handleSetVolume = async (targetId: string, volume: number) => {
    try {
      await fetch(`http://127.0.0.1:4100/api/projects/${slug}/timeline/set-audio-levels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, volume }),
      });
      await loadTimeline();
    } catch (err) {
      console.error("Set volume failed", err);
    }
  };

  const handleExportTimeline = async () => {
    try {
      setExporting(true);
      setExportSuccess(null);
      const res = await fetch(`http://127.0.0.1:4100/api/projects/${slug}/timeline/export`, {
        method: "POST",
      });
      if (res.ok) {
        setExportSuccess("Timeline exported to out/timeline-export.mp4 (1080p CFR 30fps)");
      }
    } finally {
      setExporting(false);
    }
  };

  const duration = project?.timeline?.duration || 28;
  const tracks = project?.timeline?.tracks || [];
  const subtitles = project?.timeline?.subtitles || [];

  return (
    <div className="w-full flex flex-col gap-4 font-sans text-text">
      {/* Top Toolbar */}
      <div className="bg-panel border border-border rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-panel-2 border border-border text-xs font-semibold text-text-dim">
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>OpenReel Engine v0.1.2</span>
          </div>
          <span className="text-xs text-text-faint font-mono">
            timeline/project.json • {duration.toFixed(1)}s • 1080p 30fps
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenInTimeline}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-panel-2 hover:bg-border text-xs font-medium text-text border border-border transition-colors"
            title="Generate timeline afresh from approved storyboard"
          >
            <RefreshCw className="w-3.5 h-3.5 text-primary" />
            <span>Open from Storyboard</span>
          </button>

          <button
            onClick={() => setShowAddOverlayModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-panel-2 hover:bg-border text-xs font-medium text-text border border-border transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-primary" />
            <span>Add Overlay</span>
          </button>

          <button
            onClick={handleExportTimeline}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting ? "Exporting..." : "Export Timeline MP4"}</span>
          </button>
        </div>
      </div>

      {exportSuccess && (
        <div className="bg-success/10 border border-success/30 rounded-lg p-3 text-xs text-success flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success" />
          <span>{exportSuccess}</span>
        </div>
      )}

      {/* Main Workspace: Media Pool (left), Player (center), Inspector (right) */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left: Media Pool & Scenes */}
        <div className="col-span-12 lg:col-span-3 bg-panel border border-border rounded-lg p-3 flex flex-col gap-3 h-[360px] overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-dim flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-primary" />
              Media Pool & Scenes
            </span>
            <span className="text-[10px] text-text-faint">
              {project?.mediaLibrary?.items?.length || 0} items
            </span>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
            {project?.mediaLibrary?.items?.map((item) => (
              <div
                key={item.id}
                className="bg-panel-2 hover:bg-border/60 border border-border/80 rounded p-2 flex items-center gap-2 cursor-pointer transition-colors"
                onClick={() => {
                  const clip = tracks
                    .flatMap((t) => t.clips)
                    .find((c) => c.mediaId === item.id);
                  if (clip) setSelectedClip(clip);
                }}
              >
                <div className="w-10 h-8 rounded bg-bg flex items-center justify-center border border-border text-[10px] text-text-faint overflow-hidden">
                  {item.thumbnailUrl ? (
                    <img
                      src={`http://127.0.0.1:4100${item.thumbnailUrl}`}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : item.type === "video" ? (
                    <Film className="w-4 h-4 text-text-faint" />
                  ) : item.type === "audio" ? (
                    <Music className="w-4 h-4 text-primary" />
                  ) : (
                    <Layers className="w-4 h-4 text-text-faint" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-text truncate">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-text-faint">
                    {item.type} {item.metadata?.duration ? `• ${item.metadata.duration}s` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Video Preview Canvas */}
        <div className="col-span-12 lg:col-span-6 bg-panel border border-border rounded-lg p-3 flex flex-col items-center justify-between h-[360px]">
          {/* Canvas Box */}
          <div className="w-full flex-1 bg-black rounded border border-border/60 relative flex items-center justify-center overflow-hidden">
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-bg/80 border border-border text-[10px] text-text-dim font-mono">
              1920 × 1080 • 16:9
            </div>

            {/* Simulated Frame Display */}
            <div className="text-center p-4">
              <div className="text-primary font-bold text-lg mb-1 tracking-tight">
                MOTIONFORGE STUDIO
              </div>
              <div className="text-xs text-text-dim max-w-sm mb-3">
                {selectedClip?.name || "Multi-Track Master Timeline"}
              </div>
              <div className="inline-block px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-[11px] text-primary font-mono font-medium">
                T: {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
              </div>
            </div>

            {/* Overlays preview tag */}
            {tracks.find((t) => t.id === "track-overlays")?.clips.some(
              (c) => currentTime >= c.startTime && currentTime <= c.startTime + c.duration
            ) && (
              <div className="absolute top-4 right-4 px-2 py-1 bg-primary text-white text-[10px] font-bold rounded shadow-md uppercase tracking-wide">
                [Overlay Active]
              </div>
            )}
          </div>

          {/* Transport Controls */}
          <div className="w-full flex items-center justify-between pt-3 px-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCurrentTime(0);
                  setIsPlaying(false);
                }}
                className="p-1.5 rounded hover:bg-panel-2 text-text-dim hover:text-text transition-colors"
                title="Restart"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-8 h-8 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center text-white shadow-sm transition-all"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </button>
            </div>

            {/* Timecode */}
            <div className="text-xs font-mono font-semibold text-text-dim">
              00:00:{currentTime.toFixed(0).padStart(2, "0")} / 00:00:
              {duration.toFixed(0).padStart(2, "0")}
            </div>

            {/* Track Zoom */}
            <div className="flex items-center gap-2 text-xs text-text-faint">
              <span>Zoom</span>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                className="w-20 accent-primary"
              />
            </div>
          </div>
        </div>

        {/* Right: Clip Inspector */}
        <div className="col-span-12 lg:col-span-3 bg-panel border border-border rounded-lg p-3 flex flex-col gap-3 h-[360px] overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-dim flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-primary" />
              Clip Inspector
            </span>
            {selectedClip && (
              <span className="text-[10px] text-text-faint font-mono">
                {selectedClip.id}
              </span>
            )}
          </div>

          {selectedClip ? (
            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-[10px] text-text-faint uppercase block mb-1">
                  Clip Title
                </label>
                <input
                  type="text"
                  value={selectedClip.name || ""}
                  readOnly
                  className="w-full bg-panel-2 border border-border rounded px-2.5 py-1 text-xs text-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-text-faint uppercase block mb-1">
                    In Point (s)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={selectedClip.inPoint}
                    onChange={(e) =>
                      handleTrimClip(
                        selectedClip.id,
                        parseFloat(e.target.value) || 0,
                        selectedClip.outPoint
                      )
                    }
                    className="w-full bg-panel-2 border border-border rounded px-2 py-1 text-xs text-text"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-text-faint uppercase block mb-1">
                    Out Point (s)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={selectedClip.outPoint}
                    onChange={(e) =>
                      handleTrimClip(
                        selectedClip.id,
                        selectedClip.inPoint,
                        parseFloat(e.target.value) || selectedClip.duration
                      )
                    }
                    className="w-full bg-panel-2 border border-border rounded px-2 py-1 text-xs text-text"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-text-faint uppercase block mb-1">
                  Duration
                </label>
                <div className="w-full bg-panel-2 border border-border rounded px-2.5 py-1 text-xs text-text font-mono">
                  {selectedClip.duration.toFixed(2)} seconds
                </div>
              </div>

              <div>
                <label className="text-[10px] text-text-faint uppercase block mb-1">
                  Volume ({Math.round(selectedClip.volume * 100)}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={selectedClip.volume}
                  onChange={(e) =>
                    handleSetVolume(selectedClip.id, parseFloat(e.target.value))
                  }
                  className="w-full accent-primary"
                />
              </div>

              {selectedClip.metadata?.narration && (
                <div>
                  <label className="text-[10px] text-text-faint uppercase block mb-1">
                    Narration Line
                  </label>
                  <div className="bg-panel-2 border border-border rounded p-2 text-[11px] text-text-dim">
                    {selectedClip.metadata.narration}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-text-faint text-center p-4">
              Select a clip on the timeline tracks below to edit its properties.
            </div>
          )}
        </div>
      </div>

      {/* Multi-Track Timeline Editor */}
      <div className="bg-panel border border-border rounded-lg p-3 flex flex-col gap-2 shadow-lg select-none">
        {/* Timeline Header & Time Ruler */}
        <div className="flex items-center gap-3 border-b border-border pb-2">
          <div className="w-36 text-xs font-bold uppercase tracking-wider text-text-dim flex items-center gap-1.5">
            <Scissors className="w-3.5 h-3.5 text-primary" />
            Tracks
          </div>

          {/* Timecode markers ruler */}
          <div className="flex-1 relative h-6 bg-panel-2 border border-border/80 rounded overflow-hidden">
            <div
              className="absolute top-0 bottom-0 flex"
              style={{ width: `${duration * 30 * zoomLevel}px` }}
            >
              {Array.from({ length: Math.ceil(duration / 2) + 1 }).map((_, idx) => (
                <div
                  key={idx}
                  className="border-l border-border-strong text-[9px] text-text-faint pl-1 h-full"
                  style={{ width: `${2 * 30 * zoomLevel}px` }}
                >
                  {idx * 2}s
                </div>
              ))}
            </div>

            {/* Playhead Marker */}
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-primary z-20 pointer-events-none transition-all duration-75"
              style={{ left: `${currentTime * 30 * zoomLevel}px` }}
            >
              <div className="w-2.5 h-2.5 bg-primary rounded-full -ml-[4px] -mt-1 shadow" />
            </div>
          </div>
        </div>

        {/* Tracks List */}
        <div className="flex flex-col gap-2 overflow-x-auto py-1">
          {tracks.map((track) => {
            const isVideoTrack = track.id === "track-video";
            const isOverlayTrack = track.id === "track-overlays";
            const isVoiceTrack = track.id === "track-dialogue";
            const isMusicTrack = track.id === "track-music";

            return (
              <div
                key={track.id}
                className="flex items-center gap-3 min-w-[700px] group"
              >
                {/* Track Label Header */}
                <div className="w-36 flex items-center justify-between px-2.5 py-2 rounded bg-panel-2 border border-border text-xs">
                  <div className="flex items-center gap-2 truncate">
                    {isVideoTrack ? (
                      <Film className="w-3.5 h-3.5 text-primary" />
                    ) : isOverlayTrack ? (
                      <Layers className="w-3.5 h-3.5 text-warning" />
                    ) : isVoiceTrack ? (
                      <Mic className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <Music className="w-3.5 h-3.5 text-purple-400" />
                    )}
                    <span className="font-semibold text-text truncate">
                      {track.name}
                    </span>
                  </div>

                  <button
                    onClick={() => handleSetVolume(track.id, track.muted ? 1 : 0)}
                    className="text-text-faint hover:text-text p-0.5"
                    title={track.muted ? "Unmute" : "Mute"}
                  >
                    {track.muted ? (
                      <VolumeX className="w-3 h-3 text-danger" />
                    ) : (
                      <Volume2 className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {/* Track Lane / Clips */}
                <div
                  className="flex-1 h-12 bg-panel-2 border border-border/70 rounded relative overflow-hidden"
                  style={{ width: `${duration * 30 * zoomLevel}px` }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const clickedSec = clickX / (30 * zoomLevel);
                    setCurrentTime(Number(Math.max(0, Math.min(duration, clickedSec)).toFixed(2)));
                  }}
                >
                  {track.clips.map((clip) => {
                    const isSelected = selectedClip?.id === clip.id;
                    const leftPx = clip.startTime * 30 * zoomLevel;
                    const widthPx = clip.duration * 30 * zoomLevel;

                    return (
                      <div
                        key={clip.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClip(clip);
                        }}
                        className={`absolute top-1 bottom-1 rounded border px-2 py-1 flex items-center justify-between text-[11px] font-medium cursor-pointer transition-all overflow-hidden ${
                          isSelected
                            ? "ring-2 ring-primary border-primary bg-primary/20 text-white shadow-md z-10"
                            : isVideoTrack
                            ? "bg-primary/10 border-primary/40 text-text hover:bg-primary/20"
                            : isOverlayTrack
                            ? "bg-warning/10 border-warning/40 text-text hover:bg-warning/20"
                            : isVoiceTrack
                            ? "bg-success/10 border-success/40 text-text hover:bg-success/20"
                            : "bg-purple-900/20 border-purple-500/40 text-text hover:bg-purple-900/30"
                        }`}
                        style={{
                          left: `${leftPx}px`,
                          width: `${Math.max(20, widthPx)}px`,
                        }}
                      >
                        <span className="truncate">{clip.name}</span>
                        <span className="text-[9px] text-text-faint font-mono ml-1">
                          {clip.duration.toFixed(1)}s
                        </span>
                      </div>
                    );
                  })}

                  {/* Playhead Line in track */}
                  <div
                    className="absolute top-0 bottom-0 w-[1.5px] bg-primary z-20 pointer-events-none"
                    style={{ left: `${currentTime * 30 * zoomLevel}px` }}
                  />
                </div>
              </div>
            );
          })}

          {/* Subtitles / Captions Track */}
          <div className="flex items-center gap-3 min-w-[700px] mt-1">
            <div className="w-36 flex items-center justify-between px-2.5 py-2 rounded bg-panel-2 border border-border text-xs">
              <div className="flex items-center gap-2 truncate">
                <Type className="w-3.5 h-3.5 text-primary" />
                <span className="font-semibold text-text truncate">Captions</span>
              </div>
              <span className="text-[10px] text-text-faint font-mono">
                {subtitles.length}
              </span>
            </div>

            <div
              className="flex-1 h-10 bg-panel-2 border border-border/70 rounded relative overflow-hidden"
              style={{ width: `${duration * 30 * zoomLevel}px` }}
            >
              {subtitles.map((sub) => {
                const leftPx = sub.startTime * 30 * zoomLevel;
                const widthPx = (sub.endTime - sub.startTime) * 30 * zoomLevel;
                return (
                  <div
                    key={sub.id}
                    className="absolute top-1 bottom-1 rounded bg-panel border border-primary/30 px-1.5 py-0.5 text-[10px] text-text truncate font-mono shadow-xs hover:border-primary cursor-pointer"
                    style={{
                      left: `${leftPx}px`,
                      width: `${Math.max(16, widthPx)}px`,
                    }}
                    title={sub.text}
                  >
                    "{sub.text}"
                  </div>
                );
              })}

              {/* Playhead Line */}
              <div
                className="absolute top-0 bottom-0 w-[1.5px] bg-primary z-20 pointer-events-none"
                style={{ left: `${currentTime * 30 * zoomLevel}px` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add Overlay Modal */}
      {showAddOverlayModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-panel border border-border rounded-lg p-5 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-text flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Add Timeline Overlay / B-Roll
              </h3>
              <button
                onClick={() => setShowAddOverlayModal(false)}
                className="text-text-faint hover:text-text text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-[10px] text-text-faint uppercase block mb-1">
                  Overlay Label / Title
                </label>
                <input
                  type="text"
                  value={newOverlayName}
                  onChange={(e) => setNewOverlayName(e.target.value)}
                  className="w-full bg-panel-2 border border-border rounded px-3 py-1.5 text-xs text-text focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-text-faint uppercase block mb-1">
                    Start Time (s)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={newOverlayStartTime}
                    onChange={(e) => setNewOverlayStartTime(parseFloat(e.target.value) || 0)}
                    className="w-full bg-panel-2 border border-border rounded px-3 py-1.5 text-xs text-text focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-text-faint uppercase block mb-1">
                    Duration (s)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={newOverlayDuration}
                    onChange={(e) => setNewOverlayDuration(parseFloat(e.target.value) || 1)}
                    className="w-full bg-panel-2 border border-border rounded px-3 py-1.5 text-xs text-text focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-text-faint uppercase block mb-1">
                  Opacity ({Math.round(newOverlayOpacity * 100)}%)
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={newOverlayOpacity}
                  onChange={(e) => setNewOverlayOpacity(parseFloat(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={() => setShowAddOverlayModal(false)}
                className="px-3 py-1.5 rounded bg-panel-2 hover:bg-border text-xs text-text-dim"
              >
                Cancel
              </button>
              <button
                onClick={handleAddOverlay}
                className="px-4 py-1.5 rounded bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-sm"
              >
                Insert Overlay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
