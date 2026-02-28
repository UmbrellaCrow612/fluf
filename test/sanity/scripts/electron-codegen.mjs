// scripts/electron-codegen.mjs
import { _electron as electron } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  // Path to desktop project root
  const desktopDir = path.join(__dirname, "../../../desktop");
  const mainPath = path.join(desktopDir, "dist/index.js");

  console.log("Launching Electron app for codegen...");
  console.log("Main path:", mainPath);

  if (!fs.existsSync(mainPath)) {
    throw new Error(`Main file not found: ${mainPath}`);
  }

  // Launch Electron app
  const electronApp = await electron.launch({
    args: [mainPath],
    cwd: desktopDir,
  });

  // Get the first window
  const page = await electronApp.firstWindow();
  
  // Enable console logging
  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));

  console.log("App launched! Opening Playwright Inspector...");
  console.log("Perform your actions in the app window.");
  console.log("Press 'Record' in the Inspector to generate code.");

  // This opens the Playwright Inspector (Codegen UI)
  await page.pause();

  // Close when done
  await electronApp.close();
})();