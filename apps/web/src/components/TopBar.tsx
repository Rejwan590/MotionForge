import React from "react";
import { Play, Cloud, Settings } from "lucide-react";
import { StatusDot, Pill } from "./Common.js";

export function TopBar({
  serverRunning = true,
  antigravityConnected = true,
}: {
  serverRunning?: boolean;
  antigravityConnected?: boolean;
}) {
  return (
    <header className="h-[56px] w-full bg-topbar border-b border-border px-4 flex items-center justify-between select-none">
      {/* Left branding */}
      <div className="flex items-center gap-3">
        {/* Play icon in rounded square */}
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-md">
          <Play className="w-4 h-4 fill-white text-white ml-0.5" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-[20px] tracking-tight text-text">
            MotionForge
          </span>
          <span className="text-xs text-text-faint hidden sm:inline">
            Ideas &rarr; Videos, with AI
          </span>
        </div>
      </div>

      {/* Right status badges & actions */}
      <div className="flex items-center gap-3">
        {/* Local Server Running with green dot */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-panel-2 border border-border rounded-full text-xs text-text-dim">
          <StatusDot active={serverRunning} />
          <span>Local Server Running</span>
        </div>

        {/* Connected to Antigravity pill */}
        <Pill
          variant={antigravityConnected ? "outline" : "default"}
          icon={<Cloud className="w-3.5 h-3.5" />}
        >
          Connected to Antigravity
        </Pill>

        {/* Settings gear */}
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-dim hover:text-text hover:bg-hover transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User avatar */}
        <div className="w-8 h-8 rounded-full bg-border-strong border border-border flex items-center justify-center text-xs font-semibold text-text shadow-sm">
          A
        </div>
      </div>
    </header>
  );
}
