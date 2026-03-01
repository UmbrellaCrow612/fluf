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
 * 
 * In Development test points to the dist index file 
 * In prod points to the built exe path
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

  // Switch between testing dev build and production build
  let testProdBuild: boolean = false;

  const expectedEnv = process.env["PRODUCTION"];
  if (!expectedEnv || typeof expectedEnv !== "string") {
    throw new Error("Did not recieve PRODUCTION env value cannot continue");
  }
  if (expectedEnv === "true") {
    testProdBuild = true;
  }

  if (testProdBuild) {
    logger.info("Testing against prod build");
    logger.info("Paths used: ", buildOutputDir, buildMainExe);

    if (!fs.existsSync(buildOutputDir) || !fs.existsSync(buildMainExe)) {
      throw new Error(
        `Test against production build paths not found at ${buildOutputDir} ${buildMainExe}`,
      );
    }
  } else {
    logger.info("Testing against dev build");
    logger.info("Paths used: ", desktopDir, desktopMainPath);

    if (!fs.existsSync(desktopMainPath)) {
      throw new Error(`Main file not found: ${desktopMainPath}`);
    }
  }

  const launchOptions: Parameters<typeof electron.launch>[0] = {
    args: [desktopMainPath, "--headless"], // NOTE: We pass --headless because even thou it is not officially supported it still works for our use case as of this commit, should it no longer work simple remove the flag.
    cwd: testProdBuild ? buildOutputDir : desktopDir,
  };

  if (testProdBuild) {
    launchOptions.executablePath = buildMainExe;
  }

  const app = await electron.launch(launchOptions);

  if (testFolder) {
    // In tests we can't use native picker so we return a value for UI and backend to use
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
