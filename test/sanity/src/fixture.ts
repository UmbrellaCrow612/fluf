import * as os from "node:os";
import path from "path";
import fs from "node:fs/promises";

import {
  test as base,
  type ElectronApplication,
  type Page,
} from "@playwright/test";
import { logger } from "./logger.js";
import { closeElectronApp, launchElectronApp } from "./app.js";

type ElectronFixtures = {
  app: ElectronApplication;
  mainWindow: Page;
  testPath: string;
};

/**
 * Use this to write tests for the application
 */
export const test = base.extend<ElectronFixtures>({
  testPath: async ({}, use) => {
    logger.info("testPath fixture started");

    const tempPrefix = path.join(os.tmpdir(), "test-");
    logger.info("Creating temporary folder path with prefix: " + tempPrefix);
    const testPath = await fs.mkdtemp(tempPrefix);
    logger.info("Temporary folder created at: " + testPath);

    logger.info("Calling testPath use");
    await use(testPath);
    logger.info("testPath use finished");

    try {
      logger.info("Removing temporary directory at: " + testPath);
      await fs.rm(testPath, { recursive: true, force: true });
      logger.info("Temporary directory removed: " + testPath);
    } catch (error) {
      logger.warn("Failed to remove temporary directory: " + error);
    }
  },

  app: async ({ testPath }, use) => {
    logger.info("App fixture started");

    logger.info("Launching Electron app at testPath: " + testPath);
    const app = await launchElectronApp(testPath);
    logger.info("Electron app launched");

    logger.info("Calling app use");
    await use(app);
    logger.info("App use finished");

    logger.info("Closing Electron app");
    await closeElectronApp(app);
    logger.info("App fixture cleanup finished");
  },

  mainWindow: async ({ app }, use) => {
    logger.info("Obtaining main window");
    const mainWindow = await app.firstWindow();
    logger.info("Main window obtained");

    logger.info("Calling mainWindow use");
    await use(mainWindow);
    logger.info("mainWindow use finished");
  },
});
