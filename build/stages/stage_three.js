import { Logger } from "node-logy";
import { promises } from "node:fs";
import { nodeLogyOptions, safeExit } from "../utils.js";
import { config } from "../config.js";

import { safeRun } from "node-github-actions";

const logger = new Logger(nodeLogyOptions);

safeRun(
  async () => {
    // Remove previous stage three folder
    logger.info(
      `Removing previous stage three folder at: ${config.stageThree.basePath}`,
    );
    await promises.rm(config.stageThree.basePath, {
      recursive: true,
      force: true,
    });
    logger.info("Previous stage three folder removed");

    // Verify electron binaries exist
    logger.info(
      `Verifying electron binaries exist at: ${config.desktop.electronPath}`,
    );
    await promises.access(config.desktop.electronPath);
    logger.info("Electron binaries verified");

    // Copy electron binaries to stage three
    logger.info(
      `Copying electron binaries from: ${config.desktop.electronPath} to: ${config.stageThree.basePath}`,
    );
    await promises.mkdir(config.stageThree.basePath, { recursive: true });
    await promises.cp(config.desktop.electronPath, config.stageThree.basePath, {
      recursive: true,
    });
    logger.info("Electron binaries copied successfully");

    // Remove default app asar
    logger.info(
      `Removing default app ASAR at: ${config.stageThree.defaultAppAsarPath}`,
    );
    await promises.unlink(config.stageThree.defaultAppAsarPath);
    logger.info("Default app ASAR removed");

    // Copy app asar to resources
    logger.info(
      `Copying app ASAR from: ${config.stageTwo.asarFilePath} to: ${config.stageThree.appAsarPath}`,
    );
    await promises.copyFile(
      config.stageTwo.asarFilePath,
      config.stageThree.appAsarPath,
    );
    logger.info("App ASAR copied to resources");

    // Rename exe
    logger.info(
      `Renaming executable from: ${config.stageThree.defaultExePath} to: ${config.stageThree.exePath}`,
    );
    await promises.rename(
      config.stageThree.defaultExePath,
      config.stageThree.exePath,
    );
    logger.info("Executable renamed successfully");

    logger.info("Stage three completed successfully");
  },
  {
    exitFailCode: 1,
    exitOnFailed: true,
    onBefore: () => {
      logger.info("Started stage three");
    },
    onAfter: async () => {
      await safeExit(logger);
    },
    onFail: async (err) => {
      logger.error("Stage three failed ", err);
      await safeExit(logger);
    },
    timeoutMs: 3 * 60 * 1000,
  },
);
