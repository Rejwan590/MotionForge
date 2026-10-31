import {
  OpenReelProject,
  OpenReelProjectSchema,
  Track,
  Clip,
  Transition,
  Subtitle,
  MediaItem,
} from "./schema.js";
import type { Storyboard, AssetMeta, Scene } from "@motionforge/core";

export interface StoryboardToTimelineInput {
  projectId: string;
  projectName: string;
  storyboard: Storyboard;
  assets?: AssetMeta[];
  captions?: Array<{
    word: string;
    start: number;
    end: number;
  }>;
  audioVoicePath?: string;
  audioMusicPath?: string;
  sceneClips?: Array<{
    index: number;
    videoPath?: string;
    duration?: number;
  }>;
}

export function storyboardToTimeline(input: StoryboardToTimelineInput): OpenReelProject {
  const mediaItems: MediaItem[] = [];
  const tracks: Track[] = [
    {
      id: "track-video",
      name: "Main Video",
      type: "video",
      role: "general",
      locked: false,
      hidden: false,
      muted: false,
      solo: false,
      clips: [],
      transitions: [],
    },
    {
      id: "track-overlays",
      name: "Overlays & B-Roll",
      type: "video",
      role: "general",
      locked: false,
      hidden: false,
      muted: false,
      solo: false,
      clips: [],
      transitions: [],
    },
    {
      id: "track-dialogue",
      name: "Voiceover",
      type: "audio",
      role: "dialogue",
      locked: false,
      hidden: false,
      muted: false,
      solo: false,
      clips: [],
      transitions: [],
    },
    {
      id: "track-music",
      name: "Music & FX",
      type: "audio",
      role: "music",
      locked: false,
      hidden: false,
      muted: false,
      solo: false,
      clips: [],
      transitions: [],
    },
  ];

  // Map assets into media items
  if (input.assets) {
    for (const a of input.assets) {
      const mappedType = a.type === "video" || a.type === "audio" || a.type === "image" ? a.type : "video";
      mediaItems.push({
        id: a.id,
        name: a.name,
        type: mappedType,
        thumbnailUrl: a.thumbnailUrl || null,
        originalUrl: `/api/projects/${input.projectId}/files/assets/${encodeURIComponent(a.name)}`,
        sourceFile: {
          name: a.name,
          size: a.sizeBytes,
          path: a.relativePath,
        },
        metadata: {
          duration: a.durationSeconds,
          width: a.width,
          height: a.height,
          fps: a.fps,
        },
      });
    }
  }

  let currentTime = 0;
  const videoClips: Clip[] = [];
  const transitions: Transition[] = [];

  for (let i = 0; i < input.storyboard.scenes.length; i++) {
    const sc = input.storyboard.scenes[i];
    const dur = sc.duration || 4;
    const sceneClipMeta = input.sceneClips?.find((c) => c.index === sc.index);
    const mediaId = `media-scene-${sc.index}`;

    mediaItems.push({
      id: mediaId,
      name: `Scene ${sc.index}: ${sc.title}`,
      type: "video",
      thumbnailUrl: sc.stillFrameUrl || null,
      originalUrl: sceneClipMeta?.videoPath
        ? `/api/projects/${input.projectId}/files/out/scenes/scene_${sc.index}.mp4`
        : undefined,
      metadata: {
        duration: dur,
        width: 1920,
        height: 1080,
        fps: 30,
      },
    });

    const clipId = `clip-scene-${sc.index}`;
    videoClips.push({
      id: clipId,
      mediaId,
      trackId: "track-video",
      name: `Scene ${sc.index}`,
      startTime: currentTime,
      duration: dur,
      inPoint: 0,
      outPoint: dur,
      volume: 1,
      effects: [],
      audioEffects: [],
      transform: {
        position: { x: 0, y: 0 },
        scale: { x: 1, y: 1 },
        rotation: 0,
        anchor: { x: 0.5, y: 0.5 },
        opacity: 1,
        fitMode: "cover",
      },
      metadata: {
        sceneIndex: sc.index,
        title: sc.title,
        voiceoverLine: sc.voiceoverLine,
        description: sc.description,
        styleTag: sc.styleTag,
      },
    });

    // Add transition if specified
    if (i > 0) {
      transitions.push({
        id: `trans-${i}`,
        clipAId: videoClips[i - 1].id,
        clipBId: clipId,
        type: "crossfade",
        duration: 0.5,
        params: {},
      });
    }

    currentTime += dur;
  }

  tracks[0].clips = videoClips;
  tracks[0].transitions = transitions;

  const totalDuration = currentTime > 0 ? currentTime : 10;

  // Add Voiceover clip if voice track exists
  if (input.audioVoicePath || input.storyboard.scenes.some((s) => s.voiceoverLine)) {
    const voiceMediaId = "media-audio-voice";
    mediaItems.push({
      id: voiceMediaId,
      name: "Voiceover Mix",
      type: "audio",
      originalUrl: `/api/projects/${input.projectId}/files/audio/with-voice.wav`,
      metadata: { duration: totalDuration },
    });

    tracks[2].clips.push({
      id: "clip-voice-main",
      mediaId: voiceMediaId,
      trackId: "track-dialogue",
      name: "Voiceover",
      startTime: 0,
      duration: totalDuration,
      inPoint: 0,
      outPoint: totalDuration,
      volume: 1,
      effects: [],
      audioEffects: [],
      transform: {
        position: { x: 0, y: 0 },
        scale: { x: 1, y: 1 },
        rotation: 0,
        anchor: { x: 0.5, y: 0.5 },
        opacity: 1,
        fitMode: "cover",
      },
    });
  }

  // Add Music clip
  const musicMediaId = "media-audio-music";
  mediaItems.push({
    id: musicMediaId,
    name: "Background Music & FX",
    type: "audio",
    originalUrl: `/api/projects/${input.projectId}/files/audio/music-fx-only.wav`,
    metadata: { duration: totalDuration },
  });

  tracks[3].clips.push({
    id: "clip-music-main",
    mediaId: musicMediaId,
    trackId: "track-music",
    name: "Music / FX Mix",
    startTime: 0,
    duration: totalDuration,
    inPoint: 0,
    outPoint: totalDuration,
    volume: 0.8,
    effects: [],
    audioEffects: [],
    transform: {
      position: { x: 0, y: 0 },
      scale: { x: 1, y: 1 },
      rotation: 0,
      anchor: { x: 0.5, y: 0.5 },
      opacity: 1,
      fitMode: "cover",
    },
  });

  // Map Captions into Subtitles
  const subtitles: Subtitle[] = [];
  if (input.captions && input.captions.length > 0) {
    let chunk: Array<{ word: string; start: number; end: number }> = [];
    let subIdx = 1;
    for (const w of input.captions) {
      chunk.push(w);
      if (chunk.length >= 5 || /[.?!]$/.test(w.word.trim())) {
        const text = chunk.map((c) => c.word).join(" ");
        subtitles.push({
          id: `sub-${subIdx++}`,
          text,
          startTime: chunk[0].start,
          endTime: chunk[chunk.length - 1].end,
          words: chunk.map((c) => ({
            text: c.word,
            startTime: c.start,
            endTime: c.end,
          })),
          style: {
            fontFamily: "Inter, sans-serif",
            fontSize: 48,
            color: "#ffffff",
            backgroundColor: "rgba(0,0,0,0.65)",
            position: "bottom",
            highlightColor: "#00d084",
          },
        });
        chunk = [];
      }
    }
    if (chunk.length > 0) {
      subtitles.push({
        id: `sub-${subIdx++}`,
        text: chunk.map((c) => c.word).join(" "),
        startTime: chunk[0].start,
        endTime: chunk[chunk.length - 1].end,
        words: chunk.map((c) => ({
          text: c.word,
          startTime: c.start,
          endTime: c.end,
        })),
        style: {
          fontFamily: "Inter, sans-serif",
          fontSize: 48,
          color: "#ffffff",
          backgroundColor: "rgba(0,0,0,0.65)",
          position: "bottom",
          highlightColor: "#00d084",
        },
      });
    }
  }

  const project: OpenReelProject = {
    id: input.projectId,
    name: input.projectName || "MotionForge Video",
    createdAt: Date.now(),
    modifiedAt: Date.now(),
    settings: {
      width: 1920,
      height: 1080,
      frameRate: 30,
      sampleRate: 48000,
      channels: 2,
    },
    mediaLibrary: {
      items: mediaItems,
    },
    timeline: {
      tracks,
      subtitles,
      duration: totalDuration,
    },
  };

  return OpenReelProjectSchema.parse(project);
}

export function timelineToStoryboard(project: OpenReelProject): Storyboard {
  const videoTrack = project.timeline.tracks.find((t) => t.id === "track-video") || project.timeline.tracks[0];
  const scenes: Scene[] = [];

  let scNum = 1;
  let currTime = 0;
  for (const clip of videoTrack.clips) {
    const dur = Math.round(clip.duration);
    scenes.push({
      id: `scene-${scNum}`,
      index: scNum,
      title: clip.name || `Scene ${scNum}`,
      startTime: currTime,
      endTime: currTime + dur,
      duration: dur,
      description: (clip.metadata?.description as string) || clip.name || "",
      mediaRefs: [],
      mediaType: "Video",
      styleTag: (clip.metadata?.styleTag as string) || "Cinematic",
      voiceoverLine: (clip.metadata?.voiceoverLine as string) || "",
    });
    currTime += dur;
    scNum++;
  }

  return {
    projectId: project.id,
    version: 1,
    approved: true,
    styleCode: "T",
    totalDuration: currTime,
    aspectRatio: "16:9",
    resolution: "1080p",
    scenes,
  };
}

export function recalculateDuration(project: OpenReelProject): number {
  let maxTime = 0;
  for (const track of project.timeline.tracks) {
    for (const clip of track.clips) {
      const clipEnd = clip.startTime + clip.duration;
      if (clipEnd > maxTime) maxTime = clipEnd;
    }
  }
  for (const sub of project.timeline.subtitles) {
    if (sub.endTime > maxTime) maxTime = sub.endTime;
  }
  project.timeline.duration = Number(maxTime.toFixed(3));
  project.modifiedAt = Date.now();
  return project.timeline.duration;
}

export function addClip(
  project: OpenReelProject,
  trackId: string,
  clip: Partial<Clip> & { mediaId: string; duration: number }
): Clip {
  let track = project.timeline.tracks.find((t) => t.id === trackId);
  if (!track) {
    track = project.timeline.tracks.find((t) => t.id === "track-overlays") || project.timeline.tracks[0];
  }

  const newClip: Clip = {
    id: clip.id || `clip-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    mediaId: clip.mediaId,
    trackId: track.id,
    name: clip.name || "New Clip",
    startTime: clip.startTime !== undefined ? clip.startTime : track.clips.length > 0 ? track.clips[track.clips.length - 1].startTime + track.clips[track.clips.length - 1].duration : 0,
    duration: clip.duration,
    inPoint: clip.inPoint || 0,
    outPoint: clip.outPoint || clip.duration,
    volume: clip.volume ?? 1,
    effects: clip.effects || [],
    audioEffects: clip.audioEffects || [],
    transform: clip.transform || {
      position: { x: 0, y: 0 },
      scale: { x: 1, y: 1 },
      rotation: 0,
      anchor: { x: 0.5, y: 0.5 },
      opacity: 1,
      fitMode: "cover",
    },
    metadata: clip.metadata,
  };

  track.clips.push(newClip);
  track.clips.sort((a, b) => a.startTime - b.startTime);
  recalculateDuration(project);
  return newClip;
}

export function trimClip(
  project: OpenReelProject,
  clipId: string,
  inPoint: number,
  outPoint: number
): Clip {
  for (const track of project.timeline.tracks) {
    const clip = track.clips.find((c) => c.id === clipId);
    if (clip) {
      if (outPoint <= inPoint) {
        throw new Error(`outPoint (${outPoint}) must be greater than inPoint (${inPoint})`);
      }
      clip.inPoint = Math.max(0, inPoint);
      clip.outPoint = outPoint;
      clip.duration = outPoint - inPoint;
      recalculateDuration(project);
      return clip;
    }
  }
  throw new Error(`Clip with id ${clipId} not found`);
}

export function moveClip(
  project: OpenReelProject,
  clipId: string,
  startTime: number,
  targetTrackId?: string
): Clip {
  let sourceTrack: Track | undefined;
  let clipIndex = -1;

  for (const track of project.timeline.tracks) {
    const idx = track.clips.findIndex((c) => c.id === clipId);
    if (idx !== -1) {
      sourceTrack = track;
      clipIndex = idx;
      break;
    }
  }

  if (!sourceTrack || clipIndex === -1) {
    throw new Error(`Clip with id ${clipId} not found`);
  }

  const [clip] = sourceTrack.clips.splice(clipIndex, 1);
  clip.startTime = Math.max(0, startTime);

  let targetTrack = sourceTrack;
  if (targetTrackId && targetTrackId !== sourceTrack.id) {
    const dest = project.timeline.tracks.find((t) => t.id === targetTrackId);
    if (dest) {
      targetTrack = dest;
      clip.trackId = dest.id;
    }
  }

  targetTrack.clips.push(clip);
  targetTrack.clips.sort((a, b) => a.startTime - b.startTime);
  recalculateDuration(project);
  return clip;
}

export function addTransition(
  project: OpenReelProject,
  transition: Partial<Transition> & { clipAId: string; type: "crossfade" | "wipe" | "slide" | "dissolve" | "fade" | "none"; duration?: number }
): Transition {
  const trans: Transition = {
    id: transition.id || `trans-${Date.now()}`,
    clipAId: transition.clipAId,
    clipBId: transition.clipBId,
    type: transition.type,
    duration: transition.duration ?? 0.5,
    params: transition.params || {},
  };

  const videoTrack = project.timeline.tracks.find((t) => t.id === "track-video") || project.timeline.tracks[0];
  videoTrack.transitions.push(trans);
  project.modifiedAt = Date.now();
  return trans;
}

export function addOverlay(
  project: OpenReelProject,
  overlay: {
    name: string;
    mediaId?: string;
    mediaUrl?: string;
    startTime: number;
    duration: number;
    position?: { x: number; y: number };
    scale?: { x: number; y: number };
    opacity?: number;
  }
): Clip {
  let overlaysTrack = project.timeline.tracks.find((t) => t.id === "track-overlays");
  if (!overlaysTrack) {
    overlaysTrack = {
      id: "track-overlays",
      name: "Overlays & B-Roll",
      type: "video",
      role: "general",
      locked: false,
      hidden: false,
      muted: false,
      solo: false,
      clips: [],
      transitions: [],
    };
    project.timeline.tracks.splice(1, 0, overlaysTrack);
  }

  let mediaId = overlay.mediaId;
  if (!mediaId) {
    mediaId = `media-overlay-${Date.now()}`;
    project.mediaLibrary.items.push({
      id: mediaId,
      name: overlay.name,
      type: "video",
      originalUrl: overlay.mediaUrl,
    });
  }

  const clip: Clip = {
    id: `clip-overlay-${Date.now()}`,
    mediaId,
    trackId: overlaysTrack.id,
    name: overlay.name,
    startTime: overlay.startTime,
    duration: overlay.duration,
    inPoint: 0,
    outPoint: overlay.duration,
    volume: 1,
    effects: [],
    audioEffects: [],
    transform: {
      position: overlay.position || { x: 0, y: 0 },
      scale: overlay.scale || { x: 0.5, y: 0.5 },
      rotation: 0,
      anchor: { x: 0.5, y: 0.5 },
      opacity: overlay.opacity ?? 1,
      fitMode: "contain",
    },
    metadata: { isOverlay: true },
  };

  overlaysTrack.clips.push(clip);
  overlaysTrack.clips.sort((a, b) => a.startTime - b.startTime);
  recalculateDuration(project);
  return clip;
}

export function addCaptionTrack(
  project: OpenReelProject,
  subtitles: Subtitle[]
): Subtitle[] {
  project.timeline.subtitles = subtitles;
  recalculateDuration(project);
  return project.timeline.subtitles;
}

export function setAudioLevels(
  project: OpenReelProject,
  targetId: string,
  volume: number
): { id: string; volume: number } {
  const clamped = Math.max(0, Math.min(2, volume));

  for (const track of project.timeline.tracks) {
    const clip = track.clips.find((c) => c.id === targetId);
    if (clip) {
      clip.volume = clamped;
      project.modifiedAt = Date.now();
      return { id: clip.id, volume: clamped };
    }
  }

  const track = project.timeline.tracks.find((t) => t.id === targetId);
  if (track) {
    for (const c of track.clips) {
      c.volume = clamped;
    }
    project.modifiedAt = Date.now();
    return { id: track.id, volume: clamped };
  }

  throw new Error(`Target clip or track ${targetId} not found`);
}
