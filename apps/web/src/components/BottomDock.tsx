import React, { useState } from "react";
import {
  ChevronDown,
  FolderTree,
  Folder,
  FileCode,
  FileText,
  Film,
  Send,
  Wrench,
  Terminal as TerminalIcon,
  Sparkles,
  Volume2,
  Layers,
  FolderOpen,
} from "lucide-react";
import { Pill, StatusDot, Panel } from "./Common.js";
import { ProjectFileEntry } from "@motionforge/core";

export function BottomDock({
  logs = [],
  files = [],
  projectPath = "~/MotionForge/projects/demo-launch",
  onSendCommand,
  onOpenMcpConfig,
}: {
  logs: Array<{ timestamp: string; source: string; message: string }>;
  files: ProjectFileEntry[];
  projectPath?: string;
  onSendCommand: (cmd: string) => void;
  onOpenMcpConfig?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"mcp" | "cli">("mcp");
  const [inputVal, setInputVal] = useState("");

  const toolTiles = [
    {
      id: "list_assets",
      name: "list_assets",
      desc: "Scan footage & audio files",
      icon: FolderOpen,
    },
    {
      id: "score_styles",
      name: "score_styles",
      desc: "Rank 7 styles against brief",
      icon: Sparkles,
    },
    {
      id: "prep_clip",
      name: "prep_clip",
      desc: "Crop 9:16/16:9 & 30fps CFR",
      icon: Layers,
    },
    {
      id: "generate_voice",
      name: "generate_voice",
      desc: "Kokoro TTS narration WAV",
      icon: Volume2,
    },
    {
      id: "render",
      name: "render",
      desc: "HyperFrames MP4 render",
      icon: Film,
    },
  ];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    onSendCommand(inputVal);
    setInputVal("");
  };

  return (
    <div className="grid grid-cols-12 gap-3.5 h-[230px] min-h-[230px] my-1 select-none">
      {/* 1. Agent Bridge Panel (4 cols) */}
      <Panel
        className="col-span-12 lg:col-span-4 p-3.5 flex flex-col justify-between overflow-hidden"
        title="Agent Bridge"
        headerRight={
          <div className="flex items-center gap-2">
            <Pill variant="success">Connected</Pill>
            <button className="text-text-faint hover:text-text transition-colors">
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-2 overflow-hidden">
          {/* Sub-tabs: MCP Tools / CLI Terminal */}
          <div className="flex items-center justify-between">
            <div className="flex items-center bg-panel-2 rounded-lg p-0.5 border border-border">
              <button
                onClick={() => setActiveTab("mcp")}
                className={`px-2.5 py-0.5 text-xs rounded-md font-medium transition-colors ${
                  activeTab === "mcp"
                    ? "bg-primary text-white"
                    : "text-text-dim hover:text-text"
                }`}
              >
                MCP Tools
              </button>
              <button
                onClick={() => setActiveTab("cli")}
                className={`px-2.5 py-0.5 text-xs rounded-md font-medium transition-colors ${
                  activeTab === "cli"
                    ? "bg-primary text-white"
                    : "text-text-dim hover:text-text"
                }`}
              >
                CLI Terminal
              </button>
            </div>

            <button
              onClick={onOpenMcpConfig}
              className="text-[11px] text-primary-soft hover:underline"
            >
              View MCP Config
            </button>
          </div>

          <p className="text-[11px] text-text-dim">
            The Antigravity agent inspects assets, scores styles, and writes scenes via MCP.
          </p>

          {/* Tool Tiles Grid */}
          <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-[105px] pr-1">
            {toolTiles.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.id}
                  className="p-2 rounded-lg bg-panel-2 border border-border hover:border-primary/40 hover:bg-hover transition-colors cursor-pointer group flex items-start gap-2"
                >
                  <Icon className="w-3.5 h-3.5 text-primary-soft mt-0.5 shrink-0" />
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-mono text-[11px] font-semibold text-text truncate group-hover:text-primary-soft">
                      {tool.name}
                    </span>
                    <span className="text-[9px] text-text-faint truncate">
                      {tool.desc}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Panel>

      {/* 2. Antigravity CLI Panel (5 cols) */}
      <Panel
        className="col-span-12 lg:col-span-5 p-3.5 flex flex-col justify-between overflow-hidden bg-black/40"
        title="Antigravity CLI (Live, Running)"
        headerRight={<StatusDot active={true} />}
      >
        {/* Terminal output stream */}
        <div className="flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed flex flex-col gap-1 pr-1 text-text-dim">
          {logs.length === 0 ? (
            <>
              <div className="text-text-faint">
                [16:58:02] MotionForge server daemon ready on 127.0.0.1:4100
              </div>
              <div className="text-text-faint">
                [16:58:05] Antigravity MCP socket connected: 5 tools available
              </div>
              <div className="text-primary-soft">
                [17:00:10] Project initialized: demo-launch
              </div>
              <div className="text-text-dim">
                [17:01:45] FFmpeg 9.0.2 ready with Whisper & libx264
              </div>
              <div className="text-success">
                [17:05:00] Storyboard sync: 4 scenes ready for preview
              </div>
            </>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-text-faint shrink-0">
                  [{log.timestamp}]
                </span>
                <span
                  className={
                    log.source === "server"
                      ? "text-primary-soft"
                      : log.source === "ffmpeg"
                      ? "text-yellow-400"
                      : "text-text"
                  }
                >
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Command Input Box */}
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 mt-2 pt-2 border-t border-border/40"
        >
          <span className="text-primary-soft font-mono text-xs">&gt;</span>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Type a message or command..."
            className="flex-1 bg-transparent border-none text-text font-mono text-xs focus:outline-none placeholder:text-text-faint"
          />
          <button
            type="submit"
            className="text-text-dim hover:text-primary transition-colors p-1 cursor-pointer"
            title="Send"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </Panel>

      {/* 3. Project Folder Panel (3 cols) */}
      <Panel
        className="col-span-12 lg:col-span-3 p-3.5 flex flex-col justify-between overflow-hidden"
        title="Project Folder"
        headerRight={
          <span className="font-mono text-[10px] text-text-faint max-w-[120px] truncate">
            {projectPath}
          </span>
        }
      >
        {/* File Rows */}
        <div className="flex flex-col gap-1 overflow-y-auto max-h-[125px] pr-1">
          {files.map((file, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-hover font-mono text-[11px] group transition-colors"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                {file.isDir ? (
                  <Folder className="w-3.5 h-3.5 text-primary-soft shrink-0" />
                ) : file.name.endsWith(".json") ? (
                  <FileCode className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                ) : file.name.endsWith(".mp4") ? (
                  <Film className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-text-dim shrink-0" />
                )}
                <span className="text-text truncate max-w-[90px]">
                  {file.name}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-text-faint">
                  {file.sizeFormatted}
                </span>
                {file.status === "Pending" ? (
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                    Pending
                  </span>
                ) : file.status === "Ready" ? (
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-success-bg text-success border border-success/30">
                    Ready
                  </span>
                ) : (
                  <span className="text-[10px] text-text-faint">
                    {file.modifiedAt}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-text-faint pt-1 border-t border-border mt-auto">
          The agent reads and writes to this folder.
        </p>
      </Panel>
    </div>
  );
}
