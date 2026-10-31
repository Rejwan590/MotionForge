import test from "node:test";
import assert from "node:assert/strict";
import {
  storyboardToTimeline,
  timelineToStoryboard,
  addClip,
  trimClip,
  moveClip,
  addTransition,
  addOverlay,
  setAudioLevels,
  recalculateDuration,
} from "../adapter.js";
import type { Storyboard, AssetMeta } from "@motionforge/core";

test("storyboardToTimeline creates valid multi-track OpenReel project", () => {
  const storyboard: Storyboard = {
    projectId: "demo-launch",
    version: 1,
    approved: true,
    styleCode: "T",
    totalDuration: 15,
    aspectRatio: "16:9",
    resolution: "1080p",
    scenes: [
      {
        id: "scene-1",
        index: 1,
        title: "Hook",
        startTime: 0,
        endTime: 4,
        duration: 4,
        description: "Kinetic type bounce",
        mediaRefs: [],
        mediaType: "Video",
        styleTag: "Kinetic",
        voiceoverLine: "Welcome to the next generation of video editing.",
      },
      {
        id: "scene-2",
        index: 2,
        title: "Problem",
        startTime: 4,
        endTime: 9,
        duration: 5,
        description: "Code window typing",
        mediaRefs: [],
        mediaType: "Video",
        styleTag: "Code",
        voiceoverLine: "Editing code and motion graphics used to take hours.",
      },
      {
        id: "scene-3",
        index: 3,
        title: "Solution",
        startTime: 9,
        endTime: 15,
        duration: 6,
        description: "Timeline tracks expanding",
        mediaRefs: [],
        mediaType: "Video",
        styleTag: "Clean Tech",
        voiceoverLine: "MotionForge generates scenes and builds timelines instantly.",
      },
    ],
  };

  const assets: AssetMeta[] = [
    {
      id: "asset-1",
      name: "screen.mp4",
      originalName: "screen.mp4",
      path: "/fake/path/screen.mp4",
      relativePath: "assets/screen.mp4",
      sizeBytes: 1048576,
      mimeType: "video/mp4",
      type: "video",
      durationSeconds: 15,
      width: 1920,
      height: 1080,
      fps: 30,
      createdAt: new Date().toISOString(),
    },
  ];

  const captions = [
    { word: "Welcome", start: 0.1, end: 0.5 },
    { word: "to", start: 0.5, end: 0.7 },
    { word: "the", start: 0.7, end: 0.9 },
    { word: "next", start: 0.9, end: 1.2 },
    { word: "generation.", start: 1.2, end: 1.8 },
  ];

  const project = storyboardToTimeline({
    projectId: "demo-launch",
    projectName: "Demo Launch Video",
    storyboard,
    assets,
    captions,
  });

  assert.equal(project.id, "demo-launch");
  assert.equal(project.timeline.tracks.length, 4);
  assert.equal(project.timeline.tracks[0].id, "track-video");
  assert.equal(project.timeline.tracks[0].clips.length, 3);
  assert.equal(project.timeline.duration, 15);
  assert.equal(project.timeline.subtitles.length, 1);
  assert.equal(project.timeline.subtitles[0].words?.length, 5);
});

test("trimClip modifies inPoint and outPoint", () => {
  const storyboard: Storyboard = {
    projectId: "test",
    version: 1,
    approved: true,
    styleCode: "T",
    totalDuration: 10,
    aspectRatio: "16:9",
    resolution: "1080p",
    scenes: [
      {
        id: "s1",
        index: 1,
        title: "S1",
        startTime: 0,
        endTime: 10,
        duration: 10,
        description: "D1",
        mediaRefs: [],
        mediaType: "Video",
        styleTag: "Tech",
      },
    ],
  };
  const project = storyboardToTimeline({
    projectId: "test",
    projectName: "Test",
    storyboard,
  });

  const clipId = project.timeline.tracks[0].clips[0].id;
  const trimmed = trimClip(project, clipId, 2, 7);

  assert.equal(trimmed.inPoint, 2);
  assert.equal(trimmed.outPoint, 7);
  assert.equal(trimmed.duration, 5);
});

test("moveClip reposition clip startTime and changes track", () => {
  const storyboard: Storyboard = {
    projectId: "test",
    version: 1,
    approved: true,
    styleCode: "T",
    totalDuration: 10,
    aspectRatio: "16:9",
    resolution: "1080p",
    scenes: [
      { id: "s1", index: 1, title: "S1", startTime: 0, endTime: 5, duration: 5, description: "D1", mediaRefs: [], mediaType: "Video", styleTag: "T" },
      { id: "s2", index: 2, title: "S2", startTime: 5, endTime: 10, duration: 5, description: "D2", mediaRefs: [], mediaType: "Video", styleTag: "T" },
    ],
  };
  const project = storyboardToTimeline({
    projectId: "test",
    projectName: "Test",
    storyboard,
  });

  const clip2Id = project.timeline.tracks[0].clips[1].id;
  const moved = moveClip(project, clip2Id, 12, "track-overlays");

  assert.equal(moved.startTime, 12);
  assert.equal(moved.trackId, "track-overlays");
  assert.equal(project.timeline.tracks[1].clips.length, 1);
});

test("addOverlay inserts overlay clip on track-overlays", () => {
  const storyboard: Storyboard = {
    projectId: "test",
    version: 1,
    approved: true,
    styleCode: "T",
    totalDuration: 4,
    aspectRatio: "16:9",
    resolution: "1080p",
    scenes: [{ id: "s1", index: 1, title: "S1", startTime: 0, endTime: 4, duration: 4, description: "D1", mediaRefs: [], mediaType: "Video", styleTag: "T" }],
  };
  const project = storyboardToTimeline({
    projectId: "test",
    projectName: "Test",
    storyboard,
  });

  const overlay = addOverlay(project, {
    name: "Logo Watermark",
    startTime: 1,
    duration: 3,
    position: { x: 0.8, y: 0.1 },
    scale: { x: 0.2, y: 0.2 },
    opacity: 0.9,
  });

  assert.equal(overlay.name, "Logo Watermark");
  assert.equal(overlay.trackId, "track-overlays");
  assert.equal(overlay.startTime, 1);
  assert.equal(overlay.duration, 3);
});

test("addTransition and setAudioLevels update project state", () => {
  const storyboard: Storyboard = {
    projectId: "test",
    version: 1,
    approved: true,
    styleCode: "T",
    totalDuration: 8,
    aspectRatio: "16:9",
    resolution: "1080p",
    scenes: [
      { id: "s1", index: 1, title: "S1", startTime: 0, endTime: 4, duration: 4, description: "D1", mediaRefs: [], mediaType: "Video", styleTag: "T" },
      { id: "s2", index: 2, title: "S2", startTime: 4, endTime: 8, duration: 4, description: "D2", mediaRefs: [], mediaType: "Video", styleTag: "T" },
    ],
  };
  const project = storyboardToTimeline({
    projectId: "test",
    projectName: "Test",
    storyboard,
  });

  const clipA = project.timeline.tracks[0].clips[0].id;
  const clipB = project.timeline.tracks[0].clips[1].id;

  const trans = addTransition(project, {
    clipAId: clipA,
    clipBId: clipB,
    type: "wipe",
    duration: 0.75,
  });
  assert.equal(trans.type, "wipe");

  const levelRes = setAudioLevels(project, "track-music", 0.5);
  assert.equal(levelRes.volume, 0.5);
});
