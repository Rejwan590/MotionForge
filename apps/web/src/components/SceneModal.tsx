import React, { useState, useEffect } from "react";
import { X, Film } from "lucide-react";
import { Scene } from "@motionforge/core";
import { Button } from "./Common.js";

export function SceneModal({
  isOpen,
  scene,
  onClose,
  onSave,
  onDelete,
}: {
  isOpen: boolean;
  scene: Scene | null;
  onClose: () => void;
  onSave: (updated: Scene) => void;
  onDelete?: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(4);
  const [description, setDescription] = useState("");
  const [voiceoverLine, setVoiceoverLine] = useState("");
  const [mediaType, setMediaType] = useState("Image + Video");
  const [styleTag, setStyleTag] = useState("Style: Cinematic");

  useEffect(() => {
    if (scene) {
      setTitle(scene.title);
      setDuration(scene.duration);
      setDescription(scene.description);
      setVoiceoverLine(scene.voiceoverLine || "");
      setMediaType(scene.mediaType || "Image + Video");
      setStyleTag(scene.styleTag || "Style: Cinematic");
    } else {
      setTitle("New Scene");
      setDuration(6);
      setDescription("Brief visual description of what appears in this beat.");
      setVoiceoverLine("");
      setMediaType("Image + Video");
      setStyleTag("Style: Clean Tech");
    }
  }, [scene, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Scene = {
      id: scene ? scene.id : `scene-${Date.now()}`,
      index: scene ? scene.index : 99,
      title,
      duration: Number(duration) || 4,
      startTime: scene ? scene.startTime : 0,
      endTime: (scene ? scene.startTime : 0) + (Number(duration) || 4),
      description,
      voiceoverLine,
      mediaType,
      styleTag,
      mediaRefs: scene ? scene.mediaRefs : [],
      stillFrameUrl: scene?.stillFrameUrl,
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-panel border border-border rounded-xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border bg-topbar/50">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-primary-soft" />
            <h3 className="text-md font-semibold text-text">
              {scene ? "Edit Storyboard Scene" : "Add Storyboard Scene"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-text-dim hover:text-text hover:bg-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-text">Scene Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-panel-2 border border-border rounded-lg px-3 py-2 text-xs text-text focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-text">Duration (seconds)</label>
              <input
                type="number"
                min="1"
                max="120"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="bg-panel-2 border border-border rounded-lg px-3 py-2 text-xs text-text focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-text">Media Type</label>
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value)}
                className="bg-panel-2 border border-border rounded-lg px-3 py-2 text-xs text-text focus:outline-none focus:border-primary"
              >
                <option value="Image + Video">Image + Video</option>
                <option value="Video Only">Video Only</option>
                <option value="Graphics">Graphics / Animation</option>
                <option value="Screen Recording">Screen Recording</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-text">Visual Action Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-panel-2 border border-border rounded-lg p-3 text-xs text-text focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-text">Voiceover Narration Line</label>
            <input
              type="text"
              value={voiceoverLine}
              onChange={(e) => setVoiceoverLine(e.target.value)}
              placeholder="Script line spoken during this scene..."
              className="bg-panel-2 border border-border rounded-lg px-3 py-2 text-xs text-text focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border mt-2">
            {scene && onDelete ? (
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  onDelete(scene.id);
                  onClose();
                }}
              >
                Delete Scene
              </Button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={() => handleSubmit(new Event("submit") as any)}>
                Save Scene
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
