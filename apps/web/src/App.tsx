import React, { useState, useEffect, useCallback } from "react";
import { TopBar } from "./components/TopBar.js";
import { Sidebar } from "./components/Sidebar.js";
import { ProjectHeader } from "./components/ProjectHeader.js";
import { Stepper } from "./components/Stepper.js";
import { UploadMediaCard } from "./components/UploadMediaCard.js";
import { ChooseStyleCard } from "./components/ChooseStyleCard.js";
import { StoryboardCard } from "./components/StoryboardCard.js";
import {
  VideoPreviewCard,
  StyleSettingsCard,
  VoiceCaptionsCard,
} from "./components/RightColumnCards.js";
import { BottomDock } from "./components/BottomDock.js";
import { StyleModal } from "./components/StyleModal.js";
import { SceneModal } from "./components/SceneModal.js";
import { McpModal } from "./components/McpModal.js";
import { Phase2Workspace } from "./components/Phase2Workspace.js";
import { TimelineEditor } from "./components/TimelineEditor.js";
import { RenderWorkspace } from "./components/RenderWorkspace.js";
import {
  ProjectState,
  Storyboard,
  Scene,
  StyleCode,
  createDefaultStoryboard,
  recalculateSceneTimings,
} from "@motionforge/core";

export function App() {
  const [projectSlug, setProjectSlug] = useState("demo-launch");
  const [project, setProject] = useState<ProjectState | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverOnline, setServerOnline] = useState(false);
  const [wsLogs, setWsLogs] = useState<
    Array<{ timestamp: string; source: string; message: string }>
  >([]);
  const [projectFiles, setProjectFiles] = useState<any[]>([]);

  // Modals state
  const [styleModalOpen, setStyleModalOpen] = useState(false);
  const [sceneModalOpen, setSceneModalOpen] = useState(false);
  const [activeEditingScene, setActiveEditingScene] = useState<Scene | null>(null);
  const [mcpModalOpen, setMcpModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);

  // Fallback initial data in case server is connecting
  const fallbackProject: ProjectState = {
    id: "demo-launch",
    name: "Project-Demo-Launch",
    slug: "demo-launch",
    path: "~/MotionForge/projects/demo-launch",
    phase: 1,
    phaseName: "Phase 1: Storyboard",
    updatedAt: new Date().toISOString(),
    assets: [
      {
        id: "a1",
        name: "product_demo.mp4",
        originalName: "product_demo.mp4",
        path: "assets/product_demo.mp4",
        relativePath: "assets/product_demo.mp4",
        sizeBytes: 14200000,
        mimeType: "video/mp4",
        type: "video",
        durationSeconds: 24,
        createdAt: new Date().toISOString(),
      },
      {
        id: "a2",
        name: "logo_mark.png",
        originalName: "logo_mark.png",
        path: "assets/logo_mark.png",
        relativePath: "assets/logo_mark.png",
        sizeBytes: 420000,
        mimeType: "image/png",
        type: "image",
        createdAt: new Date().toISOString(),
      },
      {
        id: "a3",
        name: "ambient_track.wav",
        originalName: "ambient_track.wav",
        path: "assets/ambient_track.wav",
        relativePath: "assets/ambient_track.wav",
        sizeBytes: 8500000,
        mimeType: "audio/wav",
        type: "audio",
        durationSeconds: 60,
        createdAt: new Date().toISOString(),
      },
    ],
    storyboard: createDefaultStoryboard("demo-launch", "Product Explainer", "T"),
    styleCode: "T",
    voiceSettings: {
      mode: "ai-voice",
      voiceId: "kokoro-en",
      speed: 1.0,
      autoCaptions: true,
      backgroundMusic: true,
      soundEffects: true,
    },
  };

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectSlug}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
        setServerOnline(true);
      } else {
        setProject(fallbackProject);
      }
    } catch {
      setProject(fallbackProject);
      setServerOnline(false);
    } finally {
      setLoading(false);
    }
  }, [projectSlug]);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectSlug}/files`);
      if (res.ok) {
        const data = await res.json();
        setProjectFiles(data);
      } else {
        setProjectFiles([
          { name: "brief.md", relativePath: "brief.md", sizeBytes: 520, sizeFormatted: "520 B", status: "Synced", modifiedAt: "1 min ago", isDir: false },
          { name: "assets/", relativePath: "assets", sizeBytes: 23120000, sizeFormatted: "23.1 MB", status: "Synced", modifiedAt: "Just now", isDir: true },
          { name: "storyboard.json", relativePath: "storyboard.json", sizeBytes: 2400, sizeFormatted: "2.4 KB", status: "Ready", modifiedAt: "2 min ago", isDir: false },
          { name: "style.json", relativePath: "style.json", sizeBytes: 120, sizeFormatted: "120 B", status: "Ready", modifiedAt: "3 min ago", isDir: false },
          { name: "render.mp4", relativePath: "out/render.mp4", sizeBytes: 0, sizeFormatted: "0 B", status: "Pending", modifiedAt: "—", isDir: false },
        ]);
      }
    } catch {
      setProjectFiles([
        { name: "brief.md", relativePath: "brief.md", sizeBytes: 520, sizeFormatted: "520 B", status: "Synced", modifiedAt: "1 min ago", isDir: false },
        { name: "assets/", relativePath: "assets", sizeBytes: 23120000, sizeFormatted: "23.1 MB", status: "Synced", modifiedAt: "Just now", isDir: true },
        { name: "storyboard.json", relativePath: "storyboard.json", sizeBytes: 2400, sizeFormatted: "2.4 KB", status: "Ready", modifiedAt: "2 min ago", isDir: false },
        { name: "style.json", relativePath: "style.json", sizeBytes: 120, sizeFormatted: "120 B", status: "Ready", modifiedAt: "3 min ago", isDir: false },
        { name: "render.mp4", relativePath: "out/render.mp4", sizeBytes: 0, sizeFormatted: "0 B", status: "Pending", modifiedAt: "—", isDir: false },
      ]);
    }
  }, [projectSlug]);

  useEffect(() => {
    fetchProject();
    fetchFiles();

    // Setup WebSocket
    let ws: WebSocket;
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

      ws.onopen = () => {
        setServerOnline(true);
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === "log") {
            setWsLogs((prev) => [
              ...prev,
              {
                timestamp: msg.timestamp || new Date().toLocaleTimeString(),
                source: msg.source || "server",
                message: msg.message,
              },
            ]);
          } else if (msg.type === "file_change") {
            fetchProject();
            fetchFiles();
          }
        } catch {}
      };

      ws.onerror = () => {
        setServerOnline(false);
      };
    } catch {}

    return () => {
      ws?.close();
    };
  }, [fetchProject, fetchFiles]);

  const handleUploadFiles = async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(`/api/projects/${projectSlug}/upload`, {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          fetchProject();
          fetchFiles();
        }
      } catch (err) {
        console.error("Upload error:", err);
      }
    }
  };

  const handleRemoveAsset = async (name: string) => {
    try {
      await fetch(`/api/projects/${projectSlug}/assets/${name}`, {
        method: "DELETE",
      });
      fetchProject();
      fetchFiles();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleSelectStyle = async (code: StyleCode) => {
    if (!project) return;
    setProject({ ...project, styleCode: code });
    try {
      await fetch(`/api/projects/${projectSlug}/style`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ styleCode: code }),
      });
      fetchFiles();
    } catch {}
  };

  const handleScoreStyles = async (answers: any) => {
    try {
      const res = await fetch(`/api/projects/${projectSlug}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return null;
  };

  const handleAnalyzeMedia = async () => {
    try {
      const res = await fetch(`/api/projects/${projectSlug}/analyze-media`);
      if (res.ok) {
        const data = await res.json();
        return data.suggestion;
      }
    } catch {}
    return "ideas_words";
  };

  const handleSaveScene = async (scene: Scene) => {
    if (!project || !project.storyboard) return;

    let updatedScenes = [...project.storyboard.scenes];
    const existingIndex = updatedScenes.findIndex((s) => s.id === scene.id);

    if (existingIndex >= 0) {
      updatedScenes[existingIndex] = scene;
    } else {
      updatedScenes.push(scene);
    }

    updatedScenes = recalculateSceneTimings(updatedScenes);
    const updatedStoryboard: Storyboard = {
      ...project.storyboard,
      scenes: updatedScenes,
      totalDuration: updatedScenes.reduce((acc, s) => acc + s.duration, 0),
    };

    setProject({ ...project, storyboard: updatedStoryboard });

    try {
      await fetch(`/api/projects/${projectSlug}/storyboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedStoryboard),
      });
      fetchFiles();
    } catch {}
  };

  const handleDeleteScene = async (id: string) => {
    if (!project || !project.storyboard) return;
    let updatedScenes = project.storyboard.scenes.filter((s) => s.id !== id);
    updatedScenes = recalculateSceneTimings(updatedScenes);

    const updatedStoryboard: Storyboard = {
      ...project.storyboard,
      scenes: updatedScenes,
      totalDuration: updatedScenes.reduce((acc, s) => acc + s.duration, 0),
    };

    setProject({ ...project, storyboard: updatedStoryboard });

    try {
      await fetch(`/api/projects/${projectSlug}/storyboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedStoryboard),
      });
      fetchFiles();
    } catch {}
  };

  const handleApproveStoryboard = async () => {
    try {
      const res = await fetch(`/api/projects/${projectSlug}/storyboard/approve`, {
        method: "POST",
      });
      if (res.ok) {
        fetchProject();
        setActiveStep(3);
      }
    } catch {}
  };

  const handleSendCommand = (cmd: string) => {
    // Send terminal input via WebSocket
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);
      socket.onopen = () => {
        socket.send(JSON.stringify({ type: "terminal_input", command: cmd }));
        setTimeout(() => socket.close(), 1000);
      };
    } catch {}
  };

  const curProject = project || fallbackProject;
  const currentStep = activeStep !== null ? activeStep : (curProject.phase === 2 ? 3 : 2);

  return (
    <div className="min-h-screen bg-app flex flex-col font-sans select-none text-text">
      {/* 1. Top Bar */}
      <TopBar
        serverRunning={serverOnline}
        antigravityConnected={true}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* 2. Left Sidebar */}
        <Sidebar
          activeId="home"
          onNewProject={() => {
            const name = prompt("Enter new project name:", "New-Project");
            if (name) {
              setProjectSlug(name.toLowerCase().replace(/[^a-z0-9_-]/g, "-"));
            }
          }}
          onOpenFolder={() => {
            handleSendCommand("explorer ~/MotionForge/projects/demo-launch");
          }}
          onMcpTools={() => setMcpModalOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col px-5 py-3 overflow-y-auto gap-2.5">
          {/* 3. Project Header */}
          <ProjectHeader
            projectName={curProject.name}
            projectPath={curProject.path}
            phaseName={currentStep === 3 ? "Phase 2: Assets & Voice" : curProject.phaseName}
            onSave={() => {
              if (curProject.storyboard) {
                handleSaveScene(curProject.storyboard.scenes[0]);
              }
            }}
            onGeneratePreview={() => {
              handleSendCommand("npx hyperframes preview");
            }}
          />

          {/* 4. Stepper */}
          <Stepper
            currentStep={currentStep}
            onStepClick={(step) => setActiveStep(step)}
          />

          {/* 5. Main Content: Phase 1 / Phase 2 / Phase 4 Timeline / Phase 3 Render */}
          {currentStep === 4 ? (
            <TimelineEditor slug={projectSlug} />
          ) : currentStep === 5 ? (
            <RenderWorkspace
              projectSlug={projectSlug}
              onBackToTimeline={() => setActiveStep(4)}
            />
          ) : currentStep === 3 ? (
            <Phase2Workspace
              projectSlug={projectSlug}
              assets={curProject.assets}
              storyboard={curProject.storyboard}
              onBackToStoryboard={() => setActiveStep(2)}
              onGoToRender={() => setActiveStep(4)}
            />
          ) : (
            <div className="grid grid-cols-12 gap-3.5 my-1">
              {/* Left Column (~285px / 3 cols) */}
              <div className="col-span-12 lg:col-span-3 flex flex-col gap-3.5">
                <UploadMediaCard
                  assets={curProject.assets}
                  onUpload={handleUploadFiles}
                  onRemoveAsset={handleRemoveAsset}
                />
                <ChooseStyleCard
                  selectedCode={curProject.styleCode}
                  onSelectStyle={handleSelectStyle}
                  onOpenQuestionnaire={() => setStyleModalOpen(true)}
                />
              </div>

              {/* Center Column (Storyboard / 5 cols) */}
              <div className="col-span-12 lg:col-span-5 flex flex-col">
                <StoryboardCard
                  storyboard={curProject.storyboard}
                  onAddScene={() => {
                    setActiveEditingScene(null);
                    setSceneModalOpen(true);
                  }}
                  onEditScene={(scene) => {
                    setActiveEditingScene(scene);
                    setSceneModalOpen(true);
                  }}
                  onEditWithAgent={() => {
                    handleSendCommand("agent /storyboard-refine");
                  }}
                  onApprove={handleApproveStoryboard}
                />
              </div>

              {/* Right Column (Preview & Settings / 4 cols) */}
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-3.5">
                <VideoPreviewCard />
                <StyleSettingsCard
                  selectedStyleCode={curProject.styleCode}
                  onStyleChange={handleSelectStyle}
                />
                <VoiceCaptionsCard
                  onGoToAssetPrep={() => {
                    setActiveStep(3);
                  }}
                />
              </div>
            </div>
          )}

          {/* 6. Bottom Dock (3 panels in one row) */}
          <BottomDock
            logs={wsLogs}
            files={projectFiles}
            projectPath={curProject.path}
            onSendCommand={handleSendCommand}
            onOpenMcpConfig={() => setMcpModalOpen(true)}
          />
        </main>
      </div>

      {/* Modals */}
      <StyleModal
        isOpen={styleModalOpen}
        onClose={() => setStyleModalOpen(false)}
        onScore={handleScoreStyles}
        onApplyStyle={handleSelectStyle}
        onAnalyzeMedia={handleAnalyzeMedia}
      />

      <SceneModal
        isOpen={sceneModalOpen}
        scene={activeEditingScene}
        onClose={() => setSceneModalOpen(false)}
        onSave={handleSaveScene}
        onDelete={handleDeleteScene}
      />

      <McpModal
        isOpen={mcpModalOpen}
        onClose={() => setMcpModalOpen(false)}
      />
    </div>
  );
}
