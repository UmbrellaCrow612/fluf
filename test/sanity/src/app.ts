import fs from "fs";
import type { ElectronApplication } from "@playwright/test";
import path from "node:path";
import { _electron as electron } from "@playwright/test";
import { logger } from "./logger.js";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Launches the electron application so we have a ref to use in tests
 */
export async function launchElectronApp(): Promise<ElectronApplication> {
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

  return electron.launch({
    args: [mainPath],
    cwd: desktopDir,
  });
}

export async function closeElectronApp(app: ElectronApplication) {
  logger.info("Attempting to close electron app");
  app?.close();
}
