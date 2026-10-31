# MotionForge build kit

How to use (5 steps)
1. Create an empty folder, e.g. `motionforge`, and open it in Antigravity.
2. Copy this kit into it so you have `PROMPT.md`, `design/`, `reference/`, and `.agent/skills/motionforge-ui/`.
3. Put your two PDFs in `docs/` (optional but recommended).
4. Open `PROMPT.md`, copy everything, paste it into the Antigravity agent, and send.
5. After each phase, check the screenshot beside `reference/ui-reference.png`. If it differs, reply:
   "Run the motionforge-ui visual QA loop again and fix every difference."

Why the interface will match
- The reference image is inside the project, so the agent can look at it.
- design/DESIGN.md describes every region in words; design/tokens.css fixes colors, radii and fonts.
- The motionforge-ui skill forces a screenshot-and-compare loop before any UI work counts as done.

Phase 4 adds the openreel-video timeline editor. The agent must run the spike in the prompt first and stop for your review before forking anything.
