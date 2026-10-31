import { z } from "zod";

export const ProjectSettingsSchema = z.object({
  width: z.number().default(1920),
  height: z.number().default(1080),
  frameRate: z.number().default(30),
  sampleRate: z.number().default(48000),
  channels: z.number().default(2),
});

export const MediaItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["video", "audio", "image"]),
  thumbnailUrl: z.string().nullable().optional(),
  originalUrl: z.string().optional(),
  sourceFile: z
    .object({
      name: z.string(),
      size: z.number(),
      lastModified: z.number().optional(),
      path: z.string().optional(),
    })
    .optional(),
  metadata: z
    .object({
      duration: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      fps: z.number().optional(),
    })
    .optional(),
});

export const TransformSchema = z.object({
  position: z.object({ x: z.number(), y: z.number() }).default({ x: 0, y: 0 }),
  scale: z.object({ x: z.number(), y: z.number() }).default({ x: 1, y: 1 }),
  rotation: z.number().default(0),
  anchor: z.object({ x: z.number(), y: z.number() }).default({ x: 0.5, y: 0.5 }),
  opacity: z.number().default(1),
  fitMode: z.enum(["contain", "cover", "stretch", "none"]).default("cover"),
});

export const ClipEffectSchema = z.object({
  id: z.string(),
  type: z.string(),
  params: z.record(z.any()).default({}),
  enabled: z.boolean().default(true),
});

export const ClipSchema = z.object({
  id: z.string(),
  mediaId: z.string(),
  trackId: z.string(),
  name: z.string().optional(),
  startTime: z.number(),
  duration: z.number(),
  inPoint: z.number().default(0),
  outPoint: z.number(),
  volume: z.number().default(1),
  effects: z.array(ClipEffectSchema).default([]),
  audioEffects: z.array(ClipEffectSchema).default([]),
  transform: TransformSchema.default({
    position: { x: 0, y: 0 },
    scale: { x: 1, y: 1 },
    rotation: 0,
    anchor: { x: 0.5, y: 0.5 },
    opacity: 1,
    fitMode: "cover",
  }),
  metadata: z.record(z.any()).optional(),
});

export const TransitionSchema = z.object({
  id: z.string(),
  clipAId: z.string(),
  clipBId: z.string().optional(),
  type: z.enum(["crossfade", "wipe", "slide", "dissolve", "fade", "none"]).default("crossfade"),
  duration: z.number().default(0.5),
  params: z.record(z.any()).default({}),
});

export const TrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["video", "audio", "image", "text", "graphics"]).default("video"),
  role: z.enum(["general", "captions", "dialogue", "music", "effects", "ambience"]).default("general"),
  clips: z.array(ClipSchema).default([]),
  transitions: z.array(TransitionSchema).default([]),
  locked: z.boolean().default(false),
  hidden: z.boolean().default(false),
  muted: z.boolean().default(false),
  solo: z.boolean().default(false),
});

export const SubtitleWordSchema = z.object({
  text: z.string(),
  startTime: z.number(),
  endTime: z.number(),
});

export const SubtitleSchema = z.object({
  id: z.string(),
  text: z.string(),
  startTime: z.number(),
  endTime: z.number(),
  style: z
    .object({
      fontFamily: z.string().default("Inter, sans-serif"),
      fontSize: z.number().default(48),
      color: z.string().default("#ffffff"),
      backgroundColor: z.string().default("rgba(0,0,0,0.6)"),
      position: z.enum(["top", "center", "bottom"]).default("bottom"),
      highlightColor: z.string().optional(),
    })
    .optional(),
  words: z.array(SubtitleWordSchema).optional(),
});

export const TimelineSchema = z.object({
  tracks: z.array(TrackSchema).default([]),
  subtitles: z.array(SubtitleSchema).default([]),
  duration: z.number().default(0),
});

export const OpenReelProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.number(),
  modifiedAt: z.number(),
  settings: ProjectSettingsSchema.default({
    width: 1920,
    height: 1080,
    frameRate: 30,
    sampleRate: 48000,
    channels: 2,
  }),
  mediaLibrary: z.object({
    items: z.array(MediaItemSchema).default([]),
  }),
  timeline: TimelineSchema,
});

export type ProjectSettings = z.infer<typeof ProjectSettingsSchema>;
export type MediaItem = z.infer<typeof MediaItemSchema>;
export type Transform = z.infer<typeof TransformSchema>;
export type Clip = z.infer<typeof ClipSchema>;
export type Transition = z.infer<typeof TransitionSchema>;
export type Track = z.infer<typeof TrackSchema>;
export type SubtitleWord = z.infer<typeof SubtitleWordSchema>;
export type Subtitle = z.infer<typeof SubtitleSchema>;
export type Timeline = z.infer<typeof TimelineSchema>;
export type OpenReelProject = z.infer<typeof OpenReelProjectSchema>;
