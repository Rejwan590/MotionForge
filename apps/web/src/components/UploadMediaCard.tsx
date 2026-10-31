import React, { useRef } from "react";
import { UploadCloud, X, Film, Image as ImageIcon, Music, FileText } from "lucide-react";
import { Panel } from "./Common.js";
import { AssetMeta } from "@motionforge/core";

export function UploadMediaCard({
  assets = [],
  onUpload,
  onRemoveAsset,
}: {
  assets: AssetMeta[];
  onUpload: (files: FileList) => void;
  onRemoveAsset: (name: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) {
      onUpload(e.dataTransfer.files);
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 KB";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Panel title="1. Upload Your Media" className="gap-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            onUpload(e.target.files);
          }
        }}
      />

      {/* Dashed Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="border border-dashed border-border-strong hover:border-primary/50 bg-panel-2/50 hover:bg-hover rounded-lg p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group"
      >
        <div className="w-10 h-10 rounded-full bg-panel-2 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
          <UploadCloud className="w-5 h-5 text-primary-soft" />
        </div>
        <p className="text-xs font-medium text-text">
          Drag & drop files here
        </p>
        <p className="text-[11px] text-text-dim mt-0.5">
          or <span className="text-primary hover:underline">click to browse</span>
        </p>
        <p className="text-[10px] text-text-faint mt-2">
          Supports: MP4, MOV, JPG, PNG, etc.
        </p>
      </div>

      {/* File List */}
      <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="flex items-center justify-between p-2 rounded-lg bg-panel-2 border border-border group hover:border-border-strong transition-colors"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              {/* Thumbnail (48px) */}
              <div className="w-12 h-12 min-w-12 rounded bg-app border border-border overflow-hidden flex items-center justify-center">
                {asset.thumbnailUrl ? (
                  <img
                    src={asset.thumbnailUrl}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                ) : asset.type === "video" ? (
                  <Film className="w-5 h-5 text-text-dim" />
                ) : asset.type === "image" ? (
                  <ImageIcon className="w-5 h-5 text-text-dim" />
                ) : asset.type === "audio" ? (
                  <Music className="w-5 h-5 text-text-dim" />
                ) : (
                  <FileText className="w-5 h-5 text-text-dim" />
                )}
              </div>

              {/* File Info */}
              <div className="flex flex-col overflow-hidden">
                <span className="font-mono text-xs text-text truncate max-w-[140px]">
                  {asset.name}
                </span>
                <span className="text-[11px] text-text-faint">
                  {formatSize(asset.sizeBytes)}
                  {asset.durationSeconds
                    ? ` • ${Math.round(asset.durationSeconds)}s`
                    : ""}
                </span>
              </div>
            </div>

            {/* Remove Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveAsset(asset.name);
              }}
              className="p-1 rounded text-text-faint hover:text-red-400 hover:bg-hover transition-colors"
              title="Remove file"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </Panel>
  );
}
