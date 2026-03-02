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

/**
 * Custom fixture fields for electron to work
 */
type ElectronFixtures = {

  /**
   * Holds a ref to the electron app launched
   */
  app: ElectronApplication;

  /**
   * Holds a ref to the main window from the app
   */
  mainWindow: Page;

  /**
   * Random test path created for the application to use in tests
   */
  testPath: string;
};

/**
 * Use this to write tests for the application
 */
export const test = base.extend<ElectronFixtures>({

  /**
   * Used to obtain the test path
   */
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

  /**
   * Used to obtain the application 
   */
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

  /**
   * Used to obtain the main window
   */
  mainWindow: async ({ app }, use) => {
    logger.info("Obtaining main window");
    const mainWindow = await app.firstWindow();
    logger.info("Main window obtained");

    mainWindow.on("console", (mess) => {
      logger.info("Page: ", mess.text());
    });

    logger.info("Calling mainWindow use");
    await use(mainWindow);
    logger.info("mainWindow use finished");
  },
});
