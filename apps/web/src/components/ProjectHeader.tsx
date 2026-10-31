import React from "react";
import { Edit2, Save, Sparkles } from "lucide-react";
import { Button, Pill } from "./Common.js";

export function ProjectHeader({
  projectName = "Project-Demo-Launch",
  projectPath = "~/MotionForge/projects/demo-launch",
  phaseName = "Phase 1: Storyboard",
  lastSaved = "Last saved 2 min ago",
  onSave,
  onGeneratePreview,
}: {
  projectName?: string;
  projectPath?: string;
  phaseName?: string;
  lastSaved?: string;
  onSave?: () => void;
  onGeneratePreview?: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 px-1 border-b border-border/50">
      {/* Title & Phase */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-semibold text-text tracking-tight flex items-center gap-2">
            <span>{projectName}</span>
            <button
              className="text-text-faint hover:text-text transition-colors p-1"
              title="Edit project name"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </h1>
          <Pill variant="outline">{phaseName}</Pill>
        </div>
        <span className="font-mono text-xs text-text-faint tracking-tight">
          {projectPath}
        </span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-text-faint">{lastSaved}</span>
        <Button variant="secondary" size="md" icon={<Save className="w-4 h-4 text-text-dim" />} onClick={onSave}>
          Save
        </Button>
        <Button
          variant="primary"
          size="md"
          className="min-w-[150px]"
          icon={<Sparkles className="w-4 h-4" />}
          onClick={onGeneratePreview}
        >
          Generate Preview
        </Button>
      </div>
    </div>
  );
}
