import { Logger } from "node-logy";
import { promises } from "node:fs";
import { createSafeRunOptions, nodeLogyOptions, safeExit } from "../utils.js";
import { config } from "../config.js";

import { runCommand, safeRun } from "node-js-script-utils";

const logger = new Logger(nodeLogyOptions);

async function main() {
  // Check if the Desktop base path exists
  await safeRun(
    async () => {
      await promises.access(config.desktop.basePath);
    },
    createSafeRunOptions(
      `Checking if desktop base path exists at ${config.desktop.basePath}`,
      "Path found",
      `Failed to find path: ${config.desktop.basePath}`,
      logger,
    ),
  );

  // Build Desktop source code
  await safeRun(
    async () => {
      await runCommand(
        "npm",
        ["run", "build"],
        { cwd: config.desktop.basePath },
        60,
      );
    },
    createSafeRunOptions(
      `Building desktop source code at ${config.desktop.basePath}`,
      "Desktop build completed",
      `Failed to build desktop source code at ${config.desktop.basePath}`,
      logger,
    ),
  );

  // Verify dist exists
  await safeRun(
    async () => {
      await promises.access(config.desktop.distPath);
    },
    createSafeRunOptions(
      `Verifying desktop dist exists at ${config.desktop.distPath}`,
      "Dist directory verified",
      `Desktop dist directory does not exist at ${config.desktop.distPath}`,
      logger,
    ),
  );

  logger.info("Desktop source code built successfully");

  // Exit
  await safeExit(logger);
}

main();
