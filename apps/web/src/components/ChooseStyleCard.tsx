import React from "react";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { Panel } from "./Common.js";
import { STYLES, StyleCode, StyleDefinition } from "@motionforge/core";

export function ChooseStyleCard({
  selectedCode = "T",
  onSelectStyle,
  onOpenQuestionnaire,
  onViewAllStyles,
}: {
  selectedCode?: StyleCode;
  onSelectStyle: (code: StyleCode) => void;
  onOpenQuestionnaire: () => void;
  onViewAllStyles?: () => void;
}) {
  // Primary 6 displayed in the 3x2 grid (Clean Tech, Kinetic Type, Walkthrough, Data Story, Warm Canvas, Chalk Talk)
  const displayCodes: StyleCode[] = ["T", "K", "W", "D", "M", "C"];

  return (
    <Panel
      title="2. Choose a Style"
      headerRight={
        <button
          onClick={onOpenQuestionnaire}
          className="flex items-center gap-1.5 text-xs text-primary-soft hover:text-white transition-colors"
          title="Auto-score based on your goals and footage"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Score Guide</span>
        </button>
      }
      className="gap-3"
    >
      {/* 3x2 Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {displayCodes.map((code) => {
          const style = STYLES[code];
          const isSelected = code === selectedCode;

          return (
            <div
              key={code}
              onClick={() => onSelectStyle(code)}
              className="flex flex-col items-center gap-1.5 cursor-pointer group select-none"
            >
              {/* Thumbnail Container */}
              <div
                className={`w-full aspect-[4/3] rounded-lg relative overflow-hidden flex flex-col items-center justify-center p-2 border transition-all ${
                  isSelected
                    ? "border-primary ring-2 ring-primary/40 shadow-[0_0_12px_rgba(63,107,255,0.3)]"
                    : "border-border hover:border-border-strong hover:scale-[1.02]"
                }`}
                style={{ background: style.previewBg }}
              >
                {/* Visual code-style preview element */}
                <div className="w-full h-full flex flex-col items-center justify-center relative">
                  {code === "K" && (
                    <div className="text-center font-black text-xs leading-none tracking-tighter text-yellow-300 transform -rotate-2">
                      BOLD<br /><span className="text-white text-[9px]">KINETIC</span>
                    </div>
                  )}
                  {code === "T" && (
                    <div className="w-full flex flex-col gap-1 px-1">
                      <div className="h-2 w-3/4 bg-primary/40 rounded-sm" />
                      <div className="h-1.5 w-1/2 bg-blue-400/30 rounded-sm" />
                      <div className="h-3 w-full bg-panel-2/80 border border-primary/30 rounded-sm flex items-center px-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      </div>
                    </div>
                  )}
                  {code === "W" && (
                    <div className="w-full h-full border border-sky-500/30 rounded bg-slate-900/60 p-1 flex flex-col justify-between">
                      <div className="flex gap-1">
                        <div className="w-1 h-1 rounded-full bg-red-400" />
                        <div className="w-1 h-1 rounded-full bg-yellow-400" />
                        <div className="w-1 h-1 rounded-full bg-green-400" />
                      </div>
                      <div className="text-[8px] text-sky-400 font-mono text-center">
                        demo.app &rarr;
                      </div>
                    </div>
                  )}
                  {code === "D" && (
                    <div className="flex items-end gap-1 h-5">
                      <div className="w-2 h-2 bg-emerald-500/40 rounded-t-sm" />
                      <div className="w-2 h-4 bg-emerald-500/70 rounded-t-sm" />
                      <div className="w-2 h-5 bg-emerald-400 rounded-t-sm" />
                    </div>
                  )}
                  {code === "M" && (
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded-full bg-orange-400/80 border border-orange-300" />
                      <div className="w-4 h-3 rounded bg-amber-900/50 border border-orange-500/30" />
                    </div>
                  )}
                  {code === "C" && (
                    <div className="text-emerald-200 font-mono text-[9px] border-b border-dashed border-emerald-300/40 pb-0.5">
                      y = f(x)
                    </div>
                  )}
                </div>

                {/* Selected Check Badge */}
                {isSelected && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center text-white shadow-sm">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[11px] font-medium tracking-tight truncate max-w-full ${
                  isSelected
                    ? "text-primary-soft font-semibold"
                    : "text-text-dim group-hover:text-text"
                }`}
              >
                {style.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* View All Styles link */}
      <div className="flex justify-end pt-1">
        <button
          onClick={onViewAllStyles || onOpenQuestionnaire}
          className="text-xs text-text-dim hover:text-text flex items-center gap-1 transition-colors"
        >
          <span>View All Styles</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </Panel>
  );
}
