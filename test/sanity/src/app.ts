import fs from "fs";
import type { ElectronApplication, Page } from "@playwright/test";
import path from "node:path";
import { _electron as electron } from "@playwright/test";
import { logger } from "./logger.js";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Ref to electron app
 */
export let electronApp: ElectronApplication;

/**
 * Ref to the main window i.e first window shown in electron application
 */
export let mainWindow: Page;

/**
 * Launches the electron application so we have a ref to use in tests
 */
export async function launchElectronApp() {
  const desktopDir = path.join(__dirname, "../../../desktop");
  const mainPath = path.join(desktopDir, "dist/index.js");

  // Debug: verify paths
  logger.info("Desktop dir:", desktopDir);
  logger.info("Main path:", mainPath);
  logger.info("Desktop exists?", fs.existsSync(desktopDir));
  logger.info("Main exists?", fs.existsSync(mainPath));

  if (!fs.existsSync(mainPath)) {
    throw new Error(`Main file not found: ${mainPath}`);
  }

  electronApp = await electron.launch({
    args: [mainPath],
    cwd: desktopDir,
  });

  mainWindow = await electronApp.firstWindow();
  mainWindow.on("console", (msg) => {
    logger.info(`${msg.type()}: ${msg.text()}`);
  });
}

export async function closeElectronApp() {
  logger.info("Attempting to close electron app");
  electronApp?.close();
}
