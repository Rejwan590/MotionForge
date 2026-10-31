import React, { useState } from "react";
import { X, Copy, Check, Wrench } from "lucide-react";
import { Button } from "./Common.js";

export function McpModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const configSnippet = `{
  "mcpServers": {
    "motionforge": {
      "command": "node",
      "args": [
        "d:/MotionForge-Kit/MotionForge-Kit/packages/mcp/dist/index.js"
      ],
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(configSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-panel border border-border rounded-xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border bg-topbar/50">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-primary-soft" />
            <h3 className="text-md font-semibold text-text">
              Antigravity MCP Configuration
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-text-dim hover:text-text hover:bg-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <p className="text-xs text-text-dim leading-relaxed">
            Paste this snippet into your Antigravity configuration file at{" "}
            <code className="text-primary-soft bg-panel-2 px-1.5 py-0.5 rounded font-mono">
              ~/.gemini/antigravity/mcp_config.json
            </code>{" "}
            to let the Antigravity agent inspect assets, score styles, and build scenes.
          </p>

          <div className="relative bg-black/50 border border-border rounded-lg p-3 overflow-x-auto">
            <pre className="font-mono text-xs text-text leading-relaxed">
              {configSnippet}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1.5 rounded bg-panel-2 border border-border hover:bg-hover text-text-dim hover:text-text transition-colors flex items-center gap-1 text-[11px]"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-success" />
                  <span className="text-success">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="flex justify-end pt-2 border-t border-border">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
