import { Logger } from "node-logy";
import { safeExit, safeRun } from "../utils.js";
import { config } from "../config.js";
import { promises } from "node:fs";

const logger = new Logger({ saveToLogFiles: true, showCallSite: true });

async function main() {
  logger.info("Started stage one");

  // Remove previous stage one folder
  logger.info(
    `Removing previous stage one folder at: ${config.stageOne.basePath}`,
  );
  await safeRun(
    async () => {
      await promises.rm(config.stageOne.basePath, {
        recursive: true,
        force: true,
      });
    },
    logger,
    `Failed to remove previous stage one folder at: ${config.stageOne.basePath}`,
  );

  // Verify desktop has a dist
  await safeRun(
    async () => {
      await promises.access(config.desktop.distPath);
    },
    logger,
    `Desktop does not have a dist at: ${config.desktop.distPath}`,
  );

  // Verify ui has a dist
  await safeRun(
    async () => {
      await promises.access(config.ui.distPath);
    },
    logger,
    `UI does not have a dist at: ${config.ui.distPath}`,
  );

  // combine them
  logger.info(
    `Copying files from: [${config.ui.distPath}, ${config.desktop.basePath}] to: ${config.stageOne.basePath}`,
  );
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
    logger,
    `Failed to copy files from: [${config.ui.distPath}, ${config.desktop.basePath}] to: ${config.stageOne.basePath}`,
  );

  // Exit
  await safeExit(logger, 0);
}

main();
