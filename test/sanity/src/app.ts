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
export async function launchElectronApp(
  testFolder?: string,
): Promise<ElectronApplication> {
  const desktopDir = path.join(__dirname, "../../../desktop");
  const desktopMainPath = path.join(desktopDir, "dist/index.js");

  const buildOutputDir = path.join(
    __dirname,
    "../../../build/build-output/stage_three",
  );
  const buildMainExe = path.join(buildOutputDir, "fluf.exe");

  // switch between testing dev build
  const testProdBuild = true; // TODO - accept env flag


  if (testProdBuild) {
    logger.info("Testing agaisnt prod build");
    logger.info("Paths used: ", buildOutputDir, buildMainExe);

    if (!fs.existsSync(buildOutputDir) || !fs.existsSync(buildMainExe)) {
      throw new Error(
        `Test agaisnt production build paths not found at ${buildOutputDir} ${buildMainExe}`,
      );
    }
  } else {
    logger.info("Testing agaisnt dev build");
    logger.info("Paths used: ", desktopDir, desktopMainPath);

    if (!fs.existsSync(desktopMainPath)) {
      throw new Error(`Main file not found: ${desktopMainPath}`);
    }
  }

  const launchOptions: Parameters<typeof electron.launch>[0] = {
    args: [desktopMainPath, "--headless"],
    cwd: testProdBuild ? buildOutputDir : desktopDir,
  };

  if (testProdBuild) {
    launchOptions.executablePath = buildMainExe;
  }

  const app = await electron.launch(launchOptions);

  if (testFolder) {
    // In tests we cant use picker native so we return a value for UI and backend to use
    logger.info("Mocking showOpenDialog, returning: " + testFolder);

    await app.evaluate(async ({ dialog }, folderPath) => {
      dialog.showOpenDialog = async () => {
        return {
          canceled: false,
          filePaths: [folderPath],
        };
      };
    }, testFolder);
  }

  return app;
}

export async function closeElectronApp(app: ElectronApplication) {
  logger.info("Attempting to close electron app");
  await app?.close();
}
