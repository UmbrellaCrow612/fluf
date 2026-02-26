import { Logger } from "node-logy";
import { promises } from "node:fs";
import { nodeLogyOptions, safeExit } from "../utils.js";
import { config } from "../config.js";

import { runCommand, safeRun } from "node-github-actions";

const logger = new Logger(nodeLogyOptions);

safeRun(
  async () => {
    // Check if the Desktop base path exists
    logger.info(
      `Checking if desktop base path exists at ${config.desktop.basePath}`,
    );
    await promises.access(config.desktop.basePath);
    logger.info("Path found");

    // Build Desktop source code
    logger.info(`Building desktop source code at ${config.desktop.basePath}`);
    await runCommand(
      "npm",
      ["run", "build"],
      { cwd: config.desktop.basePath },
      60,
    );
    logger.info("Desktop build completed");

    // Verify dist exists
    logger.info(`Verifying desktop dist exists at ${config.desktop.distPath}`);
    await promises.access(config.desktop.distPath);
    logger.info("Dist directory verified");

    logger.info("Desktop source code built successfully");
  },
  {
    exitFailCode: 1,
    exitOnFailed: true,
    onBefore: () => {
      logger.info("Started desktop build");
    },
    onAfter: async () => {
      await safeExit(logger);
    },
    onFail: async (err) => {
      logger.error("Desktop build failed ", err);
      await safeExit(logger);
    },
    timeoutMs: 3 * 60 * 1000,
  },
);
