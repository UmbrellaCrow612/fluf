import { Logger } from "node-logy";
import { nodeLogyOptions, safeExit, createSafeRunOptions } from "../utils.js";
import { config } from "../config.js";
import { promises } from "node:fs";

import { safeRun } from "node-github-actions";

const logger = new Logger(nodeLogyOptions);

async function main() {
  logger.info("Started stage one");

  // Remove previous stage one folder
  await safeRun(
    async () => {
      await promises.rm(config.stageOne.basePath, {
        recursive: true,
        force: true,
      });
    },
    createSafeRunOptions(
      `Removing previous stage one folder at: ${config.stageOne.basePath}`,
      "Previous stage one folder removed",
      `Failed to remove previous stage one folder at: ${config.stageOne.basePath}`,
      logger,
    ),
  );

  // Verify desktop has a dist
  await safeRun(
    async () => {
      await promises.access(config.desktop.distPath);
    },
    createSafeRunOptions(
      `Verifying desktop dist exists at: ${config.desktop.distPath}`,
      "Desktop dist verified",
      `Desktop does not have a dist at: ${config.desktop.distPath}`,
      logger,
    ),
  );

  // Verify ui has a dist
  await safeRun(
    async () => {
      await promises.access(config.ui.distPath);
    },
    createSafeRunOptions(
      `Verifying UI dist exists at: ${config.ui.distPath}`,
      "UI dist verified",
      `UI does not have a dist at: ${config.ui.distPath}`,
      logger,
    ),
  );

  // Combine them
  await safeRun(
    async () => {
      await promises.mkdir(config.stageOne.basePath, { recursive: true });

      // copy UI
      await promises.cp(config.ui.distPath, config.stageOne.basePath, {
        recursive: true,
      });

      // copy desktop
      await promises.cp(config.desktop.distPath, config.stageOne.basePath, {
        recursive: true,
      });
    },
    createSafeRunOptions(
      `Copying files from: [${config.ui.distPath}, ${config.desktop.distPath}] to: ${config.stageOne.basePath}`,
      "Files copied successfully",
      `Failed to copy files from: [${config.ui.distPath}, ${config.desktop.distPath}] to: ${config.stageOne.basePath}`,
      logger,
    ),
  );

  logger.info("Stage one completed successfully");

  // Exit
  await safeExit(logger);
}

main();
