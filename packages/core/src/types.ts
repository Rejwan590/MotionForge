import { z } from "zod";

export type StyleCode = "K" | "C" | "T" | "W" | "D" | "M" | "P";

export interface StyleDefinition {
  id: string;
  code: StyleCode;
  name: string;
  tagline: string;
  lookDescription: string;
  buildNotes: string;
  bestFramework: "HyperFrames" | "Remotion" | "Revideo";
  needsFootage: "Optional" | "No" | "Yes, your talking head" | "Real recording best" | "No (needs data file)";
  voiceFit: string;
  soundPalette: string;
  bestLength: string;
  avoidWhen: string;
  badge: string;
  accentColor: string;
  previewBg: string;
}

export interface QuestionOption {
  id: string;
  label: string;
  points: Partial<Record<StyleCode, number>>;
}

export interface QuestionnaireAnswers {
  q1?: string; // Main thing on screen
  q2?: string; // Desired viewer outcome / feeling
  q3?: string; // Tone
  q4?: string; // Length / platform
  q5?: string; // Audience
  hasFootageOfUser?: boolean;
  hasAppOrScreen?: boolean;
  hasDataOrNumbers?: boolean;
  targetDurationSeconds?: number;
}

export interface StyleScoreResult {
  scores: Record<StyleCode, number>;
  ranked: Array<{
    code: StyleCode;
    style: StyleDefinition;
    score: number;
    eliminated: boolean;
    eliminationReason?: string;
    reason: string;
    avoidWarning: string;
  }>;
  primary: StyleDefinition;
  runnerUp?: StyleDefinition;
  isTie: boolean;
  hybridSuggestion?: string;
  recommendationNote: string;
}

export const SceneSchema = z.object({
  id: z.string(),
  index: z.number(),
  title: z.string(),
  startTime: z.number(), // in seconds
  endTime: z.number(),   // in seconds
  duration: z.number(),
  description: z.string(),
  mediaRefs: z.array(z.string()).default([]),
  mediaType: z.string().default("Image + Video"),
  styleTag: z.string().default("Cinematic"),
  stillFrameUrl: z.string().optional(),
  voiceoverLine: z.string().optional(),
});

export type Scene = z.infer<typeof SceneSchema>;

export const StoryboardSchema = z.object({
  projectId: z.string(),
  version: z.number().default(1),
  approved: z.boolean().default(false),
  approvedAt: z.string().optional(),
  styleCode: z.enum(["K", "C", "T", "W", "D", "M", "P"]).default("T"),
  totalDuration: z.number(),
  aspectRatio: z.enum(["16:9", "9:16", "1:1"]).default("16:9"),
  resolution: z.enum(["1080p", "4K", "720p"]).default("1080p"),
  scenes: z.array(SceneSchema),
});

export type Storyboard = z.infer<typeof StoryboardSchema>;

export interface AssetMeta {
  id: string;
  name: string;
  originalName: string;
  path: string;
  relativePath: string;
  sizeBytes: number;
  mimeType: string;
  type: "video" | "image" | "audio" | "document" | "other";
  durationSeconds?: number;
  width?: number;
  height?: number;
  fps?: number;
  thumbnailUrl?: string;
  hasAudio?: boolean;
  createdAt: string;
}

export interface ProjectFileEntry {
  name: string;
  relativePath: string;
  sizeBytes: number;
  sizeFormatted: string;
  status: string;
  modifiedAt: string;
  isDir: boolean;
}

export interface ProjectState {
  id: string;
  name: string;
  slug: string;
  path: string;
  phase: 1 | 2 | 3 | 4;
  phaseName: string;
  updatedAt: string;
  assets: AssetMeta[];
  storyboard: Storyboard | null;
  styleCode: StyleCode;
  voiceSettings: {
    mode: "my-voice" | "ai-voice" | "no-voice";
    voiceId: string;
    speed: number;
    autoCaptions: boolean;
    backgroundMusic: boolean;
    soundEffects: boolean;
  };
}
