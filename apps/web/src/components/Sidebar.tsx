import React from "react";
import {
  Home,
  FolderKanban,
  Palette,
  Film,
  Bot,
  Settings,
  Plus,
  FolderOpen,
  Wrench,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "styles", label: "Styles", icon: Palette },
  { id: "assets", label: "Assets", icon: Film },
  { id: "agent", label: "Agent", icon: Bot },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  activeId = "home",
  onSelectNav,
  onNewProject,
  onOpenFolder,
  onMcpTools,
}: {
  activeId?: string;
  onSelectNav?: (id: string) => void;
  onNewProject?: () => void;
  onOpenFolder?: () => void;
  onMcpTools?: () => void;
}) {
  return (
    <aside className="w-[207px] min-w-[207px] h-full bg-sidebar border-r border-border flex flex-col justify-between p-3 select-none">
      {/* Top Navigation */}
      <div className="flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              onClick={() => onSelectNav?.(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary-bg text-white border border-primary/20"
                  : "text-text-dim hover:text-text hover:bg-hover"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? "text-white" : "text-text-dim"
                }`}
                strokeWidth={1.75}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Group: Quick Actions & Tagline */}
      <div className="flex flex-col gap-3 pt-4 border-t border-border">
        <span className="text-xs font-semibold text-text-faint px-2 tracking-wider uppercase">
          Quick Actions
        </span>

        <div className="flex flex-col gap-2">
          {/* New Project (primary) */}
          <button
            onClick={onNewProject}
            className="w-full h-[36px] bg-primary hover:bg-primary-hover text-white rounded-lg flex items-center justify-center gap-2 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>

          {/* Open Folder (secondary) */}
          <button
            onClick={onOpenFolder}
            className="w-full h-[36px] bg-panel-2 hover:bg-hover border border-border text-text rounded-lg flex items-center justify-center gap-2 text-xs font-medium transition-colors cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-text-dim" />
            <span>Open Folder</span>
          </button>

          {/* MCP Tools (secondary) */}
          <button
            onClick={onMcpTools}
            className="w-full h-[36px] bg-panel-2 hover:bg-hover border border-border text-text rounded-lg flex items-center justify-center gap-2 text-xs font-medium transition-colors cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5 text-text-dim" />
            <span>MCP Tools</span>
          </button>
        </div>

        {/* Faint Tagline */}
        <p className="text-[10.5px] text-text-faint px-1 mt-1 leading-relaxed">
          Better prompts. Better visuals. With your AI agent.
        </p>
      </div>
    </aside>
  );
}
