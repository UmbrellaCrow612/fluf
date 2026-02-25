import { Logger } from "node-logy";
import { nodeLogyOptions, safeExit, createSafeRunOptions } from "../utils.js";
import { config } from "../config.js";
import { promises } from "node:fs";
import { createPackage } from "@electron/asar";

import { safeRun } from "node-github-actions";

const logger = new Logger(nodeLogyOptions);

async function main() {
  logger.info("Started stage two");

  // Remove previous asar file
  await safeRun(
    async () => {
      await promises.rm(config.stageTwo.basePath, {
        force: true,
        recursive: true,
      });
    },
    createSafeRunOptions(
      `Removing previous stage two path at: ${config.stageTwo.basePath}`,
      "Previous stage two path removed",
      `Failed to remove previous stage two path at: ${config.stageTwo.basePath}`,
      logger,
    ),
  );

  // Verify stage_one folder exists
  await safeRun(
    async () => {
      await promises.access(config.stageOne.basePath);
    },
    createSafeRunOptions(
      `Checking if stage one path exists at: ${config.stageOne.basePath}`,
      "Stage one path verified",
      `Stage one path does not exist at: ${config.stageOne.basePath}`,
      logger,
    ),
  );

  // ASAR the stage two
  await safeRun(
    async () => {
      await promises.mkdir(config.stageTwo.basePath, { recursive: true });

      await createPackage(
        config.stageOne.basePath,
        config.stageTwo.asarFilePath,
      );
    },
    createSafeRunOptions(
      `Performing ASAR for directory at: ${config.stageOne.basePath} to: ${config.stageTwo.asarFilePath}`,
      "ASAR package created successfully",
      `Failed to create ASAR package from: ${config.stageOne.basePath} to: ${config.stageTwo.asarFilePath}`,
      logger,
    ),
  );

  logger.info("Stage two completed successfully");

  // Exit
  await safeExit(logger);
}

main();
