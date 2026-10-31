import React, { useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  Maximize2,
  Subtitles,
  Mic,
  ArrowRight,
  Sliders,
  AudioLines,
} from "lucide-react";
import { Panel, Button, Pill, Toggle, Select } from "./Common.js";
import { STYLES, StyleCode } from "@motionforge/core";

export function VideoPreviewCard({
  previewVideoUrl,
}: {
  previewVideoUrl?: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const duration = 28;

  return (
    <Panel
      title="Preview"
      headerRight={<Pill variant="default">HD</Pill>}
      className="p-3 gap-2"
    >
      {/* 16:9 Video Player Container */}
      <div className="w-full aspect-video bg-black rounded-lg relative overflow-hidden border border-border flex flex-col justify-between group">
        {/* Mock/Real Video Content */}
        {previewVideoUrl ? (
          <video
            src={previewVideoUrl}
            className="w-full h-full object-cover"
            controls={false}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-[#030b18] via-[#07111f] to-[#12233a] flex flex-col items-center justify-center p-4 relative">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3f6bff_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="z-10 flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary cursor-pointer hover:scale-105 transition-transform">
                <Play className="w-5 h-5 fill-primary text-primary ml-0.5" />
              </div>
              <span className="text-xs font-semibold text-text tracking-wide">
                HyperFrames Canvas
              </span>
              <span className="text-[10px] text-text-faint font-mono">
                1920 × 1080 • 30 fps
              </span>
            </div>
          </div>
        )}

        {/* Video Controls Bar */}
        <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5 flex flex-col gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          {/* Scrubber bar */}
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer relative">
            <div
              className="h-full bg-primary relative"
              style={{ width: `${(currentTime / duration) * 100 || 15}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-text">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="hover:text-primary transition-colors cursor-pointer"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-white" />
                ) : (
                  <Play className="w-4 h-4 fill-white" />
                )}
              </button>
              <span className="font-mono text-[11px] text-text-dim">
                0:04 / 0:28
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button className="text-text-dim hover:text-text">
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <button className="text-primary-soft hover:text-text">
                <Subtitles className="w-3.5 h-3.5" />
              </button>
              <button className="text-text-dim hover:text-text">
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function StyleSettingsCard({
  selectedStyleCode = "T",
  onStyleChange,
}: {
  selectedStyleCode?: StyleCode;
  onStyleChange: (code: StyleCode) => void;
}) {
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [resolution, setResolution] = useState("1080p");
  const [duration, setDuration] = useState("28s");

  const styleOptions = Object.values(STYLES).map((s) => ({
    value: s.code,
    label: `${s.name} (${s.code})`,
  }));

  return (
    <Panel title="Style Settings" className="p-3 gap-3">
      {/* Style selector */}
      <Select
        label="Visual Style"
        value={selectedStyleCode}
        onChange={(val) => onStyleChange(val as StyleCode)}
        options={styleOptions}
      />

      <div className="grid grid-cols-3 gap-2">
        <Select
          label="Aspect Ratio"
          value={aspectRatio}
          onChange={setAspectRatio}
          options={[
            { value: "16:9", label: "16:9 (Landscape)" },
            { value: "9:16", label: "9:16 (Vertical)" },
            { value: "1:1", label: "1:1 (Square)" },
          ]}
        />
        <Select
          label="Resolution"
          value={resolution}
          onChange={setResolution}
          options={[
            { value: "1080p", label: "1080p FHD" },
            { value: "4K", label: "4K UHD" },
            { value: "720p", label: "720p HD" },
          ]}
        />
        <Select
          label="Duration"
          value={duration}
          onChange={setDuration}
          options={[
            { value: "28s", label: "28s (Auto)" },
            { value: "30s", label: "30s Target" },
            { value: "60s", label: "60s Extended" },
          ]}
        />
      </div>
    </Panel>
  );
}

export function VoiceCaptionsCard({
  onGoToAssetPrep,
}: {
  onGoToAssetPrep: () => void;
}) {
  const [autoCaptions, setAutoCaptions] = useState(true);
  const [backgroundMusic, setBackgroundMusic] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);

  return (
    <Panel
      title="Voice & Captions"
      headerRight={<Pill variant="success">Ready</Pill>}
      className="p-3 gap-2.5"
    >
      {/* Voice row */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-panel-2 border border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary-bg flex items-center justify-center text-primary-soft">
            <AudioLines className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-text">
              Kokoro (English)
            </span>
            <span className="text-[10px] text-text-faint">
              Local 82M TTS Model
            </span>
          </div>
        </div>
        <button className="text-xs text-primary-soft hover:underline">
          Change
        </button>
      </div>

      {/* Toggles */}
      <div className="flex flex-col gap-0.5 divide-y divide-border/40 py-1">
        <Toggle
          label="Auto Captions (Whisper)"
          checked={autoCaptions}
          onChange={setAutoCaptions}
        />
        <Toggle
          label="Background Music"
          checked={backgroundMusic}
          onChange={setBackgroundMusic}
        />
        <Toggle
          label="Sound Effects (Whoosh & Impacts)"
          checked={soundEffects}
          onChange={setSoundEffects}
        />
      </div>

      {/* Go to Asset Prep button */}
      <Button
        variant="primary"
        size="md"
        className="w-full mt-1"
        icon={<ArrowRight className="w-4 h-4" />}
        onClick={onGoToAssetPrep}
      >
        Go to Asset Prep &rarr;
      </Button>
    </Panel>
  );
}
