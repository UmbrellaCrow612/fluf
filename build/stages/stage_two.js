import { Logger } from "node-logy";
import { promises } from "node:fs";
import { nodeLogyOptions, safeExit } from "../utils.js";
import { config } from "../config.js";
import { createPackage } from "@electron/asar";

import { safeRun } from "node-github-actions";

const logger = new Logger(nodeLogyOptions);

safeRun(
  async () => {
    // Remove previous stage two folder
    logger.info(
      `Removing previous stage two folder at: ${config.stageTwo.basePath}`,
    );
    await promises.rm(config.stageTwo.basePath, {
      recursive: true,
      force: true,
    });
    logger.info("Previous stage two folder removed");

    // Verify stage_one folder exists
    logger.info(
      `Verifying stage one folder exists at: ${config.stageOne.basePath}`,
    );
    await promises.access(config.stageOne.basePath);
    logger.info("Stage one folder verified");

    // ASAR the stage two
    logger.info(
      `Creating ASAR package from: ${config.stageOne.basePath} to: ${config.stageTwo.asarFilePath}`,
    );
    await promises.mkdir(config.stageTwo.basePath, { recursive: true });

    await createPackage(config.stageOne.basePath, config.stageTwo.asarFilePath);
    logger.info("ASAR package created successfully");

    logger.info("Stage two completed successfully");
  },
  {
    exitFailCode: 1,
    exitOnFailed: true,
    onBefore: () => {
      logger.info("Started stage two");
    },
    onAfter: async () => {
      await safeExit(logger);
    },
    onFail: async (err) => {
      logger.error("Stage two failed ", err);
      await safeExit(logger);
    },
    timeoutMs: 3 * 60 * 1000,
  },
);
