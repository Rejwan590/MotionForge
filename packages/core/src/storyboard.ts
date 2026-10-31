import { Storyboard, StoryboardSchema, Scene, StyleCode } from "./types.js";

export function createDefaultStoryboard(projectId: string, title: string = "Product Explainer", styleCode: StyleCode = "T"): Storyboard {
  const scenes: Scene[] = [
    {
      id: "scene-1",
      index: 1,
      title: "Opening Shot (0:00 - 0:04)",
      startTime: 0,
      endTime: 4,
      duration: 4,
      description: "Logo reveal with smooth kinetic motion blur and subtle grid background.",
      mediaRefs: [],
      mediaType: "Image + Video",
      styleTag: "Style: Cinematic",
      voiceoverLine: "Welcome to the future of automated video creation.",
    },
    {
      id: "scene-2",
      index: 2,
      title: "Problem Statement (0:04 - 0:12)",
      startTime: 4,
      endTime: 12,
      duration: 8,
      description: "Split-screen comparison showing traditional editing friction vs AI generation.",
      mediaRefs: [],
      mediaType: "Video",
      styleTag: "Style: Clean Tech",
      voiceoverLine: "Creating high-production explainers used to take days of keyframing.",
    },
    {
      id: "scene-3",
      index: 3,
      title: "Feature Showcase (0:12 - 0:20)",
      startTime: 12,
      endTime: 20,
      duration: 8,
      description: "Interactive UI card transition highlighting real-time code preview and timeline.",
      mediaRefs: [],
      mediaType: "Image + Video",
      styleTag: "Style: Clean Tech",
      voiceoverLine: "MotionForge turns code and media into finished video in seconds.",
    },
    {
      id: "scene-4",
      index: 4,
      title: "Call to Action (0:20 - 0:28)",
      startTime: 20,
      endTime: 28,
      duration: 8,
      description: "High-contrast kinetic text typography with final URL and launch badge.",
      mediaRefs: [],
      mediaType: "Graphics",
      styleTag: "Style: Kinetic",
      voiceoverLine: "Start building today with your local AI agent.",
    },
  ];

  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

  return {
    projectId,
    version: 1,
    approved: false,
    styleCode,
    totalDuration,
    aspectRatio: "16:9",
    resolution: "1080p",
    scenes,
  };
}

export function validateStoryboard(data: unknown): { success: boolean; data?: Storyboard; error?: string } {
  const res = StoryboardSchema.safeParse(data);
  if (!res.success) {
    return { success: false, error: res.error.message };
  }
  return { success: true, data: res.data };
}

export function recalculateSceneTimings(scenes: Scene[]): Scene[] {
  let currentTime = 0;
  return scenes.map((s, idx) => {
    const start = currentTime;
    const end = currentTime + s.duration;
    currentTime = end;
    return {
      ...s,
      index: idx + 1,
      startTime: start,
      endTime: end,
      title: `${idx + 1}. ${s.title.replace(/^\d+\.\s*/, "").replace(/\s*\(\d+:\d+\s*-\s*\d+:\d+\)/, "")} (${formatTime(start)} - ${formatTime(end)})`,
    };
  });
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
