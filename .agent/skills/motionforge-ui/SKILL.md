---
name: motionforge-ui
description: Use whenever building or changing any MotionForge screen, component or style. Enforces the dark design system in design/tokens.css and the layout in design/DESIGN.md, and requires a screenshot comparison against reference/ui-reference.png before finishing UI work.
---

# MotionForge UI skill

1. Read design/DESIGN.md and design/tokens.css, and open reference/ui-reference.png.
2. Use only the CSS variables from tokens.css (map them into the Tailwind theme). No new hex colors, no gradients except the preview thumbnails.
3. Build with React + TypeScript + Tailwind + lucide-react. Reusable components: Panel, Button, Pill, StatusDot, Stepper, DropZone, FileRow,
   StyleTile, SceneRow, Toggle, Select, Terminal, ToolTile, FolderList, VideoPlayer.
4. Visual QA loop (required before you say a UI task is done):
   - Run the app, open it with Playwright at 1536x1024, save a screenshot to qa/current.png.
   - Compare with reference/ui-reference.png region by region (top bar, sidebar, header, stepper, 3 columns, bottom dock).
   - List every difference in spacing, size, color, radius and text, fix them, and repeat until the layout matches.
   - Content (project names, thumbnails) may differ; structure, proportions and styling must not.
5. Never hard-code status text. Bind chips and badges to real state.
