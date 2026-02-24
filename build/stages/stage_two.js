import { Logger } from "node-logy";
import { nodeLogyOptions, safeExit, safeRun } from "../utils.js";
import { config } from "../config.js";
import { promises } from "node:fs";
import { createPackage } from "@electron/asar";

const logger = new Logger(nodeLogyOptions);

async function main() {
  logger.info("Started stage two");

  // remove previous asar file
  logger.info(
    `Removing previous stage two path at: ${config.stageTwo.basePath}`,
  );
  await safeRun(
    async () => {
      await promises.rm(config.stageTwo.basePath, {
        force: true,
        recursive: true,
      });
    },
    logger,
    `Failed to remove previous stage two path at: ${config.stageTwo.basePath}`,
  );

  // verify stage_one folder exists
  logger.info(
    `Checking if stage one path exists at: ${config.stageOne.basePath}`,
  );
  await safeRun(
    async () => {
      await promises.access(config.stageOne.basePath);
    },
    logger,
    `Failed to check if stage one path exists at: ${config.stageOne.basePath}`,
  );

  // asar the stage two
  logger.info(
    `Performing ASAR for directory at: ${config.stageOne.basePath} to: ${config.stageTwo.asarFilePath}`,
  );
  await safeRun(
    async () => {
      await promises.mkdir(config.stageTwo.basePath, { recursive: true });

      await createPackage(
        config.stageOne.basePath,
        config.stageTwo.asarFilePath,
      );
    },
    logger,
    `Failed to ASAR for directory at: ${config.stageOne.basePath} to: ${config.stageTwo.asarFilePath}`,
  );

  // Exit
  await safeExit(logger, 0);
}

main();
