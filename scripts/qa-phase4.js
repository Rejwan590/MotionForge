import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs/promises";

async function runVisualQA() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const context = await browser.newContext({
    viewport: { width: 1536, height: 1024 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();
  console.log("Navigating to http://127.0.0.1:5173/...");
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // 1. Capture Step 4: Edit (Multi-track Timeline Editor)
  console.log("Clicking Stepper Step 4 (Edit)...");
  // Find step 4 in stepper and click
  const step4 = page.locator("text=Edit").first();
  await step4.click();
  await page.waitForTimeout(1500);

  const qaDir = path.resolve("qa");
  await fs.mkdir(qaDir, { recursive: true });

  const editStepPath = path.join(qaDir, "edit_step.png");
  await page.screenshot({ path: editStepPath, fullPage: false });
  console.log(`Saved screenshot: ${editStepPath}`);

  // Copy to artifact directory
  const artifactDir = "C:\\Users\\Shamima Sultana Hira\\.gemini\\antigravity\\brain\\14cdba46-fac5-424b-bc6a-517897bcb0e1";
  await fs.copyFile(editStepPath, path.join(artifactDir, "edit_step.png"));

  // 2. Capture Step 5: Render (Final HyperFrames MP4 Render Studio)
  console.log("Clicking Stepper Step 5 (Render)...");
  const step5 = page.locator("text=Render").first();
  await step5.click();
  await page.waitForTimeout(1500);

  const renderStepPath = path.join(qaDir, "render_step.png");
  await page.screenshot({ path: renderStepPath, fullPage: false });
  console.log(`Saved screenshot: ${renderStepPath}`);
  await fs.copyFile(renderStepPath, path.join(artifactDir, "render_step.png"));

  await browser.close();
  console.log("Visual QA completed successfully!");
}

runVisualQA().catch((err) => {
  console.error("QA error:", err);
  process.exit(1);
});
