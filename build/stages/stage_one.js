import { Logger } from "node-logy";
import { promises } from "node:fs";
import { nodeLogyOptions, safeExit } from "../utils.js";
import { config } from "../config.js";

import { safeRun } from "node-github-actions";

const logger = new Logger(nodeLogyOptions);

safeRun(
  async () => {
    // Remove previous stage one folder
    logger.info(
      `Removing previous stage one folder at: ${config.stageOne.basePath}`,
    );
    await promises.rm(config.stageOne.basePath, {
      recursive: true,
      force: true,
    });
    logger.info("Previous stage one folder removed");

    // Verify desktop has a dist
    logger.info(`Verifying desktop dist exists at: ${config.desktop.distPath}`);
    await promises.access(config.desktop.distPath);
    logger.info("Desktop dist verified");

    // Verify ui has a dist
    logger.info(`Verifying UI dist exists at: ${config.ui.distPath}`);
    await promises.access(config.ui.distPath);
    logger.info("UI dist verified");

    // Combine them
    logger.info(
      `Copying files from: [${config.ui.distPath}, ${config.desktop.distPath}] to: ${config.stageOne.basePath}`,
    );
    await promises.mkdir(config.stageOne.basePath, { recursive: true });

    // copy UI
    await promises.cp(config.ui.distPath, config.stageOne.basePath, {
      recursive: true,
    });

    // copy desktop
    await promises.cp(config.desktop.distPath, config.stageOne.basePath, {
      recursive: true,
    });
    logger.info("Files copied successfully");

    logger.info("Stage one completed successfully");
  },
  {
    exitFailCode: 1,
    exitOnFailed: true,
    onBefore: () => {
      logger.info("Started stage one");
    },
    onAfter: async () => {
      await safeExit(logger);
    },
    onFail: async (err) => {
      logger.error("Stage one failed ", err);
      await safeExit(logger);
    },
    timeoutMs: 3 * 60 * 1000,
  },
);
