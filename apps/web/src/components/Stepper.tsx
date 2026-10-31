import React from "react";
import { Check } from "lucide-react";

export interface StepItem {
  number: number;
  title: string;
  subtitle: string;
}

const steps: StepItem[] = [
  { number: 1, title: "Upload & Score", subtitle: "Assets & style selector" },
  { number: 2, title: "Storyboard", subtitle: "Review scenes & beats" },
  { number: 3, title: "Assets & Voice", subtitle: "Prep, Kokoro TTS, captions" },
  { number: 4, title: "Edit", subtitle: "Multi-track timeline editor" },
  { number: 5, title: "Render", subtitle: "HyperFrames MP4 generation" },
];

export function Stepper({
  currentStep = 2,
  onStepClick,
}: {
  currentStep?: number;
  onStepClick?: (step: number) => void;
}) {
  return (
    <div className="w-full bg-panel border border-border rounded-lg px-6 py-3 my-3">
      <div className="flex items-center justify-between relative">
        {steps.map((s, idx) => {
          const isDone = s.number < currentStep;
          const isCurrent = s.number === currentStep;
          const isPending = s.number > currentStep;

          return (
            <React.Fragment key={s.number}>
              {/* Step indicator node */}
              <div
                onClick={() => onStepClick?.(s.number)}
                className="flex items-center gap-3 cursor-pointer z-10 group"
              >
                {/* Number or check badge */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    isDone
                      ? "bg-success text-white shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                      : isCurrent
                      ? "bg-primary text-white shadow-[0_0_10px_rgba(63,107,255,0.5)] ring-2 ring-primary/30"
                      : "bg-panel-2 border border-border text-text-faint"
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4 stroke-[2.5]" /> : s.number}
                </div>

                {/* Title & subtitle */}
                <div className="flex flex-col">
                  <span
                    className={`text-sm font-semibold tracking-tight ${
                      isCurrent
                        ? "text-text"
                        : isDone
                        ? "text-text-dim"
                        : "text-text-faint"
                    }`}
                  >
                    {s.title}
                  </span>
                  <span className="text-[11px] text-text-faint">
                    {s.subtitle}
                  </span>
                </div>
              </div>

              {/* Connecting line between steps */}
              {idx < steps.length - 1 && (
                <div className="flex-1 mx-4 h-[2px] bg-border-strong relative">
                  <div
                    className="absolute inset-0 bg-primary transition-all duration-300"
                    style={{
                      width: isDone ? "100%" : isCurrent ? "50%" : "0%",
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
