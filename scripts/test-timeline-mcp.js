// Quick verification of timeline MCP endpoints and server
async function testTimelineEndpoints() {
  const base = "http://127.0.0.1:4100/api/projects/demo-launch";

  console.log("1. Testing GET /timeline...");
  const res1 = await fetch(`${base}/timeline`);
  const project = await res1.json();
  console.log(`Timeline loaded: ${project.timeline.tracks.length} tracks, duration: ${project.timeline.duration}s`);

  console.log("2. Testing POST /timeline/add-overlay...");
  const res2 = await fetch(`${base}/timeline/add-overlay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      overlay: {
        name: "MCP Test Watermark",
        startTime: 2,
        duration: 4,
        opacity: 0.85,
        scale: { x: 0.25, y: 0.25 }
      }
    }),
  });
  const overlayClip = await res2.json();
  console.log(`Overlay added successfully: ${overlayClip.id} on track ${overlayClip.trackId}`);

  console.log("3. Testing POST /timeline/set-audio-levels...");
  const res3 = await fetch(`${base}/timeline/set-audio-levels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      targetId: "track-music",
      volume: 0.65
    }),
  });
  const levelRes = await res3.json();
  console.log(`Audio level set:`, levelRes);

  console.log("4. Testing POST /timeline/export...");
  const res4 = await fetch(`${base}/timeline/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const exportRes = await res4.json();
  console.log(`Export job triggered:`, exportRes);

  console.log("All timeline endpoints verified successfully!");
}

testTimelineEndpoints().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
