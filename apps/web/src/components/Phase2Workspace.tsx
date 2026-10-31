import React, { useState, useEffect } from "react";
import {
  Scissors,
  Crop,
  Layers,
  FileAudio,
  Volume2,
  Play,
  Pause,
  Sparkles,
  Subtitles,
  AudioWaveform,
  Sliders,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  XCircle,
  Download,
} from "lucide-react";
import { Panel, Button, Pill, Select } from "./Common.js";
import { AssetMeta, Storyboard } from "@motionforge/core";

export function Phase2Workspace({
  projectSlug,
  assets = [],
  storyboard,
  onBackToStoryboard,
  onGoToRender,
}: {
  projectSlug: string;
  assets: AssetMeta[];
  storyboard: Storyboard | null;
  onBackToStoryboard: () => void;
  onGoToRender: () => void;
}) {
  const [selectedAsset, setSelectedAsset] = useState<string>(assets[0]?.name || "sample_clip.mp4");
  const [preppedFiles, setPreppedFiles] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [activeJob, setActiveJob] = useState<any>(null);

  // Voice state
  const [voiceMode, setVoiceMode] = useState<"ai-voice" | "my-voice" | "no-voice">("ai-voice");
  const [selectedVoice, setSelectedVoice] = useState("af_heart");
  const [scriptText, setScriptText] = useState(
    storyboard?.scenes.map((s) => s.voiceoverLine || s.description).join(" ") ||
      "Welcome to MotionForge. Turn code and media into finished video in seconds."
  );
  const [voiceAudioUrl, setVoiceAudioUrl] = useState<string | null>(null);

  // Captions state
  const [captions, setCaptions] = useState<any[]>([]);
  const [transcribing, setTranscribing] = useState(false);

  // Sound & mix state
  const [dualMixResult, setDualMixResult] = useState<any>(null);
  const [mixing, setMixing] = useState(false);

  // Audio player state
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const refreshPrepped = async () => {
    try {
      const res = await fetch(`/api/projects/${projectSlug}/prep/files`);
      if (res.ok) {
        const data = await res.json();
        setPreppedFiles(data.files || []);
      }
    } catch {}
  };

  const refreshJobs = async () => {
    try {
      const res = await fetch(`/api/projects/${projectSlug}/jobs`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        const running = data.jobs.find((j: any) => j.status === "running" || j.status === "queued");
        setActiveJob(running || data.jobs[data.jobs.length - 1] || null);
      }
    } catch {}
  };

  useEffect(() => {
    refreshPrepped();
    refreshJobs();
    const interval = setInterval(refreshJobs, 1500);
    return () => clearInterval(interval);
  }, [projectSlug]);

  const handleRunPrep = async (endpoint: string, body: any) => {
    try {
      await fetch(`/api/projects/${projectSlug}/prep/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      refreshPrepped();
      refreshJobs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateVoice = async () => {
    try {
      const res = await fetch(`/api/projects/${projectSlug}/voice/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: scriptText, voiceId: selectedVoice, speed: 1.0 }),
      });
      if (res.ok) {
        setVoiceAudioUrl(`/api/projects/${projectSlug}/audio/voice.wav?t=${Date.now()}`);
        refreshJobs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTranscribeCaptions = async () => {
    setTranscribing(true);
    try {
      const res = await fetch(`/api/projects/${projectSlug}/captions/transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioFileName: "voice.wav" }),
      });
      if (res.ok) {
        const data = await res.json();
        setCaptions(data.segments || []);
      }
    } finally {
      setTranscribing(false);
      refreshJobs();
    }
  };

  const handleGenerateSfx = async (type: "whoosh" | "impact") => {
    try {
      await fetch(`/api/projects/${projectSlug}/sound/${type}`, { method: "POST" });
      refreshJobs();
    } catch (err) {}
  };

  const handleBuildDualMix = async () => {
    setMixing(true);
    try {
      const res = await fetch(`/api/projects/${projectSlug}/sound/dual-mix`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setDualMixResult(data);
      }
    } finally {
      setMixing(false);
      refreshJobs();
    }
  };

  return (
    <div className="flex flex-col gap-4 py-2 select-none">
      {/* Top action strip */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={onBackToStoryboard}>
            &larr; Back to Storyboard
          </Button>
          <span className="text-md font-semibold text-text">
            Phase 2: Assets Prep, Voice & Sound Design
          </span>
        </div>

        <div className="flex items-center gap-2">
          {dualMixResult && (
            <Pill variant="success" icon={<CheckCircle2 className="w-3.5 h-3.5 text-success" />}>
              Dual Mix Ready (-16 LUFS)
            </Pill>
          )}
          <Button variant="primary" size="md" icon={<ArrowRight className="w-4 h-4" />} onClick={onGoToRender}>
            Continue to Timeline Editor &rarr;
          </Button>
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left Column (6 cols): Asset Prep Tools */}
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-4">
          <Panel
            title="1. Asset Prep Tools (FFmpeg)"
            subtitle="Trim, crop, normalize loudness, and generate CFR proxies"
          >
            {/* Asset selector */}
            <div className="flex flex-col gap-2 mb-3">
              <label className="text-xs text-text-dim font-medium">
                Select Source Asset from assets/
              </label>
              <select
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                className="bg-panel-2 border border-border text-text rounded-lg p-2 text-xs"
              >
                {assets.map((a) => (
                  <option key={a.id} value={a.name}>
                    {a.name} ({a.type}, {(a.sizeBytes / 1024).toFixed(0)} KB)
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Action Prep Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<Crop className="w-3.5 h-3.5 text-primary-soft" />}
                onClick={() => handleRunPrep("crop", { assetName: selectedAsset, aspect: "16:9" })}
              >
                Crop 16:9
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<Crop className="w-3.5 h-3.5 text-primary-soft" />}
                onClick={() => handleRunPrep("crop", { assetName: selectedAsset, aspect: "9:16" })}
              >
                Crop 9:16
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<Layers className="w-3.5 h-3.5 text-emerald-400" />}
                onClick={() => handleRunPrep("cfr", { assetName: selectedAsset, targetFps: 30 })}
              >
                CFR 30fps
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<Scissors className="w-3.5 h-3.5 text-yellow-400" />}
                onClick={() => handleRunPrep("trim", { assetName: selectedAsset, startSec: 0, durationSec: 4 })}
              >
                Trim 0-4s
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<FileAudio className="w-3.5 h-3.5 text-sky-400" />}
                onClick={() => handleRunPrep("extract-audio", { assetName: selectedAsset })}
              >
                Extract Audio
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<Volume2 className="w-3.5 h-3.5 text-purple-400" />}
                onClick={() => handleRunPrep("normalize", { fileName: selectedAsset, targetLufs: -16 })}
              >
                Norm -16LUFS
              </Button>
            </div>

            {/* Prepped Files List */}
            <div className="mt-4 pt-3 border-t border-border flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text uppercase tracking-wider">
                  Prepped Outputs (prep/)
                </span>
                <span className="text-[11px] text-text-faint">
                  {preppedFiles.length} files
                </span>
              </div>

              <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                {preppedFiles.length === 0 ? (
                  <span className="text-xs text-text-faint italic py-2">
                    No prepped copies yet. Click any tool above to process.
                  </span>
                ) : (
                  preppedFiles.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg bg-panel-2 border border-border text-xs font-mono"
                    >
                      <span className="text-text truncate max-w-[240px]">
                        {file.name}
                      </span>
                      <a
                        href={`/api/projects/${projectSlug}/prep/${file.name}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary-soft hover:underline text-[11px]"
                      >
                        Preview &rarr;
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Panel>

          {/* Job Queue & Progress Panel */}
          <Panel
            title="Active Job Log"
            headerRight={
              activeJob && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-dim font-mono">
                    {activeJob.progress}%
                  </span>
                  <div className="w-16 h-1.5 bg-panel-2 rounded-full overflow-hidden border border-border">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${activeJob.progress}%` }}
                    />
                  </div>
                </div>
              )
            }
          >
            <div className="bg-black/40 rounded-lg p-2.5 font-mono text-[11px] leading-relaxed max-h-[120px] overflow-y-auto flex flex-col gap-1 text-text-dim">
              {activeJob ? (
                activeJob.logs.map((log: string, idx: number) => (
                  <div key={idx} className="text-text-dim">
                    {log}
                  </div>
                ))
              ) : (
                <span className="text-text-faint">Idle. Ready for next operation.</span>
              )}
            </div>
          </Panel>
        </div>

        {/* Right Column (6 cols): Voice, Captions & Sound */}
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-4">
          {/* 2. Voice Generation Studio */}
          <Panel
            title="2. Voice Narration Studio"
            subtitle="Kokoro-82M on-device TTS with voice selection"
            headerRight={
              <div className="flex items-center bg-panel-2 rounded-lg p-0.5 border border-border text-xs">
                <button
                  onClick={() => setVoiceMode("ai-voice")}
                  className={`px-2 py-0.5 rounded ${voiceMode === "ai-voice" ? "bg-primary text-white" : "text-text-dim"}`}
                >
                  AI Voice
                </button>
                <button
                  onClick={() => setVoiceMode("my-voice")}
                  className={`px-2 py-0.5 rounded ${voiceMode === "my-voice" ? "bg-primary text-white" : "text-text-dim"}`}
                >
                  My Voice
                </button>
                <button
                  onClick={() => setVoiceMode("no-voice")}
                  className={`px-2 py-0.5 rounded ${voiceMode === "no-voice" ? "bg-primary text-white" : "text-text-dim"}`}
                >
                  No Voice
                </button>
              </div>
            }
          >
            <div className="flex flex-col gap-3">
              {/* Voice Picker */}
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Voice Profile"
                  value={selectedVoice}
                  onChange={setSelectedVoice}
                  options={[
                    { value: "af_heart", label: "Heart (Kokoro en-US Female)" },
                    { value: "af_nova", label: "Nova (Kokoro en-US Female)" },
                    { value: "af_sky", label: "Sky (Kokoro en-US Female)" },
                    { value: "am_adam", label: "Adam (Kokoro en-US Male)" },
                    { value: "am_michael", label: "Michael (Kokoro en-US Male)" },
                    { value: "bf_emma", label: "Emma (Kokoro British Female)" },
                    { value: "bm_george", label: "George (Kokoro British Male)" },
                    { value: "en-US-JennyNeural", label: "Jenny (Edge Neural Female)" },
                    { value: "en-US-GuyNeural", label: "Guy (Edge Neural Male)" },
                  ]}
                />
                <div className="flex flex-col justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    className="h-[36px]"
                    icon={<AudioWaveform className="w-4 h-4" />}
                    onClick={handleGenerateVoice}
                  >
                    Synthesize Narration
                  </Button>
                </div>
              </div>

              {/* Script textarea */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-text-dim font-medium">Script Narration</label>
                <textarea
                  rows={2}
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  className="bg-panel-2 border border-border rounded-lg p-2 text-xs text-text focus:outline-none focus:border-primary"
                />
              </div>

              {/* Generated Audio playback */}
              {voiceAudioUrl && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-panel-2 border border-primary/30">
                  <span className="text-xs text-primary-soft font-mono">
                    audio/voice.wav
                  </span>
                  <audio controls src={voiceAudioUrl} className="h-7 w-64" />
                </div>
              )}
            </div>
          </Panel>

          {/* 3. Captions Studio (Whisper) */}
          <Panel
            title="3. Word-Level Captions (Whisper)"
            subtitle="Word-level timestamps written to audio/captions.json and .srt"
            headerRight={
              <Button
                variant="secondary"
                size="sm"
                icon={<Subtitles className="w-3.5 h-3.5 text-primary" />}
                onClick={handleTranscribeCaptions}
                disabled={transcribing}
              >
                {transcribing ? "Transcribing..." : "Transcribe"}
              </Button>
            }
          >
            <div className="flex flex-col gap-2 max-h-[110px] overflow-y-auto pr-1">
              {captions.length === 0 ? (
                <span className="text-xs text-text-faint italic py-2">
                  Click &ldquo;Transcribe&rdquo; to generate word-aligned captions from narration.
                </span>
              ) : (
                captions.map((seg, idx) => (
                  <div key={idx} className="flex flex-col gap-1 p-2 rounded bg-panel-2 border border-border text-xs">
                    <div className="flex justify-between text-[10px] text-text-faint font-mono">
                      <span>Cue #{seg.id}</span>
                      <span>{seg.start}s &rarr; {seg.end}s</span>
                    </div>
                    <span className="text-text font-medium">{seg.text}</span>
                    {seg.words && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {seg.words.slice(0, 8).map((w: any, wi: number) => (
                          <span key={wi} className="px-1.5 py-0.2 rounded bg-primary-bg text-primary-soft text-[9.5px] font-mono">
                            {w.word} ({w.start}s)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Panel>

          {/* 4. Sound FX & Dual Mix */}
          <Panel
            title="4. Sound Effects & Dual Mix (-16 LUFS)"
            subtitle="Whoosh & Impact SFX, sidechain ducking, dual output mixes"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  icon={<Sparkles className="w-3.5 h-3.5 text-yellow-400" />}
                  onClick={() => handleGenerateSfx("whoosh")}
                >
                  Gen Whoosh SFX
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  icon={<Sparkles className="w-3.5 h-3.5 text-red-400" />}
                  onClick={() => handleGenerateSfx("impact")}
                >
                  Gen Impact SFX
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={handleBuildDualMix}
                  disabled={mixing}
                >
                  {mixing ? "Mixing..." : "Build Dual Mix"}
                </Button>
              </div>

              {/* Dual Mix Outputs */}
              {dualMixResult && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                  <div className="flex flex-col gap-1 p-2 rounded-lg bg-panel-2 border border-border text-xs">
                    <span className="font-semibold text-text">Mix 1: with-voice.wav</span>
                    <span className="text-[10px] text-text-dim">Ducked music + voice + SFX</span>
                    <Pill variant="success">{dualMixResult.withVoiceLufs} LUFS</Pill>
                    <audio controls src={`/api/projects/${projectSlug}/audio/with-voice.wav?t=${Date.now()}`} className="h-6 w-full mt-1" />
                  </div>
                  <div className="flex flex-col gap-1 p-2 rounded-lg bg-panel-2 border border-border text-xs">
                    <span className="font-semibold text-text">Mix 2: music-fx-only.wav</span>
                    <span className="text-[10px] text-text-dim">Music + SFX only (No Voice)</span>
                    <Pill variant="success">{dualMixResult.musicFxLufs} LUFS</Pill>
                    <audio controls src={`/api/projects/${projectSlug}/audio/music-fx-only.wav?t=${Date.now()}`} className="h-6 w-full mt-1" />
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
