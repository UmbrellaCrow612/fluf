import { Logger } from "node-logy";
import { promises } from "node:fs";
import { createSafeRunOptions, nodeLogyOptions, safeExit } from "../utils.js";
import { config } from "../config.js";

import { runCommand, safeRun } from "node-github-actions";

const logger = new Logger(nodeLogyOptions);

async function main() {
  // Check if the UI base path exists
  await safeRun(
    async () => {
      await promises.access(config.ui.basePath);
    },
    createSafeRunOptions(
      `Checking if UI base path exists at ${config.ui.basePath}`,
      "Path found",
      `UI base path does not exist: ${config.ui.basePath}`,
      logger,
    ),
  );

  // Build UI source code
  await safeRun(
    async () => {
      await runCommand(
        "npm",
        ["run", "build"],
        { cwd: config.ui.basePath },
        60,
      );
    },
    createSafeRunOptions(
      `Building UI source code at ${config.ui.basePath}`,
      "UI build completed",
      `Failed to build UI source code at ${config.ui.basePath}`,
      logger,
    ),
  );

  // Verify dist exists
  await safeRun(
    async () => {
      await promises.access(config.ui.distPath);
    },
    createSafeRunOptions(
      `Verifying UI dist exists at ${config.ui.distPath}`,
      "Dist directory verified",
      `UI dist directory does not exist at ${config.ui.distPath}`,
      logger,
    ),
  );

  logger.info("UI source code built successfully");

  // Exit
  await safeExit(logger);
}

main();
