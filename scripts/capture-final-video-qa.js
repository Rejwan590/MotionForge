import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs/promises";

async function capture() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const context = await browser.newContext({
    viewport: { width: 1536, height: 1024 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Navigate to Step 5 (Render)
  const step5 = page.locator("text=Render").first();
  await step5.click();
  await page.waitForTimeout(1200);

  const outDir = path.resolve("qa");
  const qaFile = path.join(outDir, "autonomous_render_qa.png");
  await page.screenshot({ path: qaFile, fullPage: false });

  const artifactDir = "C:\\Users\\Shamima Sultana Hira\\.gemini\\antigravity\\brain\\14cdba46-fac5-424b-bc6a-517897bcb0e1";
  await fs.copyFile(qaFile, path.join(artifactDir, "autonomous_render_qa.png"));

  await browser.close();
  console.log("Captured autonomous_render_qa.png");
}

capture().catch((e) => {
  console.error(e);
  process.exit(1);
});
