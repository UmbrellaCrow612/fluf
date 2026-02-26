import { Logger } from "node-logy";
import { promises } from "node:fs";
import { nodeLogyOptions, safeExit } from "../utils.js";
import { config } from "../config.js";

import { runCommand, safeRun } from "node-github-actions";

const logger = new Logger(nodeLogyOptions);

safeRun(
  async () => {
    // Check if the UI base path exists
    logger.info(`Checking if UI base path exists at ${config.ui.basePath}`);
    await promises.access(config.ui.basePath);
    logger.info("Path found");

    // Build UI source code
    logger.info(`Building UI source code at ${config.ui.basePath}`);
    await runCommand("npm", ["run", "build"], { cwd: config.ui.basePath }, 60);
    logger.info("UI build completed");

    // Verify dist exists
    logger.info(`Verifying UI dist exists at ${config.ui.distPath}`);
    await promises.access(config.ui.distPath);
    logger.info("Dist directory verified");

    logger.info("UI source code built successfully");
  },
  {
    exitFailCode: 1,
    exitOnFailed: true,
    onBefore: () => {
      logger.info("Started UI build");
    },
    onAfter: async () => {
      await safeExit(logger);
    },
    onFail: async (err) => {
      logger.error("UI build failed ", err);
      await safeExit(logger);
    },
    timeoutMs: 3 * 60 * 1000,
  },
);
