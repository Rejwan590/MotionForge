import React, { useState } from "react";
import { X, Sparkles, Check, AlertCircle, ArrowRight } from "lucide-react";
import {
  QUESTION_1_OPTIONS,
  QUESTION_2_OPTIONS,
  QUESTION_3_OPTIONS,
  QUESTION_4_OPTIONS,
  QUESTION_5_OPTIONS,
  StyleScoreResult,
  StyleCode,
  STYLES,
} from "@motionforge/core";
import { Button, Pill } from "./Common.js";

export function StyleModal({
  isOpen,
  onClose,
  onScore,
  onApplyStyle,
  onAnalyzeMedia,
}: {
  isOpen: boolean;
  onClose: () => void;
  onScore: (answers: any) => Promise<StyleScoreResult>;
  onApplyStyle: (code: StyleCode) => void;
  onAnalyzeMedia: () => Promise<string>;
}) {
  const [q1, setQ1] = useState("ideas_words");
  const [q2, setQ2] = useState("hyped");
  const [q3, setQ3] = useState("loud");
  const [q4, setQ4] = useState("under_60");
  const [q5, setQ5] = useState("creators");
  const [hasFootage, setHasFootage] = useState(true);
  const [hasApp, setHasApp] = useState(true);
  const [hasData, setHasData] = useState(true);
  const [scoreResult, setScoreResult] = useState<StyleScoreResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  if (!isOpen) return null;

  const handleScore = async () => {
    const res = await onScore({
      q1,
      q2,
      q3,
      q4,
      q5,
      hasFootageOfUser: hasFootage,
      hasAppOrScreen: hasApp,
      hasDataOrNumbers: hasData,
    });
    setScoreResult(res);
  };

  const handleAutoAnalyze = async () => {
    setAnalyzing(true);
    try {
      const suggested = await onAnalyzeMedia();
      if (suggested) {
        setQ1(suggested);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-panel border border-border rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-topbar/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-bg flex items-center justify-center text-primary-soft">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-md font-semibold text-text">
                Style Selector Guide
              </h2>
              <p className="text-xs text-text-dim">
                Determine the optimal motion graphics style based on your goals and footage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-text-dim hover:text-text hover:bg-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-5">
          {/* Analyze Media Button */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-panel-2 border border-border">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-text">
                Auto-Inspect Uploads
              </span>
              <span className="text-[11px] text-text-dim">
                Inspect media files with FFprobe to auto-detect face, screen, or data files
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAutoAnalyze}
              disabled={analyzing}
            >
              {analyzing ? "Inspecting..." : "Analyze My Media"}
            </Button>
          </div>

          {/* Q1 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text">
              Q1. What is the main thing on screen?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(QUESTION_1_OPTIONS).map(([key, opt]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setQ1(key)}
                  className={`text-left p-2.5 rounded-lg border text-xs font-medium transition-all ${
                    q1 === key
                      ? "bg-primary-bg border-primary text-white"
                      : "bg-panel-2 border-border text-text-dim hover:border-border-strong hover:text-text"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q2 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text">
              Q2. What should viewers do or feel at the end?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(QUESTION_2_OPTIONS).map(([key, opt]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setQ2(key)}
                  className={`text-left p-2.5 rounded-lg border text-xs font-medium transition-all ${
                    q2 === key
                      ? "bg-primary-bg border-primary text-white"
                      : "bg-panel-2 border-border text-text-dim hover:border-border-strong hover:text-text"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q3 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text">
              Q3. What tone fits?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(QUESTION_3_OPTIONS).map(([key, opt]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setQ3(key)}
                  className={`text-left p-2 rounded-lg border text-xs font-medium transition-all ${
                    q3 === key
                      ? "bg-primary-bg border-primary text-white"
                      : "bg-panel-2 border-border text-text-dim hover:border-border-strong hover:text-text"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q4 & Q5 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text">
                Q4. Length & Platform
              </label>
              <select
                value={q4}
                onChange={(e) => setQ4(e.target.value)}
                className="bg-panel-2 border border-border text-text rounded-lg p-2 text-xs"
              >
                {Object.entries(QUESTION_4_OPTIONS).map(([key, opt]) => (
                  <option key={key} value={key} className="bg-panel">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text">
                Q5. Audience
              </label>
              <select
                value={q5}
                onChange={(e) => setQ5(e.target.value)}
                className="bg-panel-2 border border-border text-text rounded-lg p-2 text-xs"
              >
                {Object.entries(QUESTION_5_OPTIONS).map(([key, opt]) => (
                  <option key={key} value={key} className="bg-panel">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Hard Rules (Q6) */}
          <div className="flex flex-col gap-2 pt-2 border-t border-border">
            <span className="text-xs font-semibold text-text">
              Q6. Hard Availability Constraints
            </span>
            <div className="flex flex-wrap gap-4 text-xs text-text-dim">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasFootage}
                  onChange={(e) => setHasFootage(e.target.checked)}
                  className="rounded bg-panel-2 border-border text-primary"
                />
                <span>I have talking-head footage (Warm Canvas)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasApp}
                  onChange={(e) => setHasApp(e.target.checked)}
                  className="rounded bg-panel-2 border-border text-primary"
                />
                <span>I have app/screen recordings (Walkthrough)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasData}
                  onChange={(e) => setHasData(e.target.checked)}
                  className="rounded bg-panel-2 border-border text-primary"
                />
                <span>I have real data figures (Data Story)</span>
              </label>
            </div>
          </div>

          {/* Score Calculation Button */}
          <div className="pt-2">
            <Button variant="primary" size="md" className="w-full" onClick={handleScore}>
              Calculate Recommended Style
            </Button>
          </div>

          {/* Scoring Results display */}
          {scoreResult && (
            <div className="p-4 rounded-xl bg-panel-2 border border-primary/30 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-text uppercase tracking-wider">
                    Recommended Primary:
                  </span>
                  <span className="text-md font-bold text-primary-soft">
                    {scoreResult.primary.name} ({scoreResult.primary.code})
                  </span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onApplyStyle(scoreResult.primary.code);
                    onClose();
                  }}
                >
                  Apply {scoreResult.primary.name}
                </Button>
              </div>

              <p className="text-xs text-text-dim leading-relaxed">
                {scoreResult.recommendationNote}
              </p>

              {/* Ranked Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border">
                {scoreResult.ranked.map((item) => (
                  <div
                    key={item.code}
                    className={`p-2 rounded-lg border text-xs flex flex-col ${
                      item.eliminated
                        ? "bg-red-950/20 border-red-900/30 text-text-faint line-through opacity-60"
                        : item.code === scoreResult.primary.code
                        ? "bg-primary-bg border-primary text-text font-semibold"
                        : "bg-panel border-border text-text-dim"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{item.style.name}</span>
                      <span>{item.score} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
