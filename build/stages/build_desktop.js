import { Logger } from "node-logy";
import { promises } from "node:fs";
import { safeExit, safeRun, runCommand } from "../utils.js";
import { config } from "../config.js";

const logger = new Logger({ saveToLogFiles: true, showCallSite: true });

async function main() {
  logger.info(`Building desktop source code at ${config.desktop.basePath}`);

  // Check if the Desktop base path exists
  await safeRun(
    async () => {
      await promises.access(config.desktop.basePath);
    },
    logger,
    "Desktop base path does not exist",
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
    logger,
    `Failed to build desktop source code at ${config.desktop.basePath}`,
  );

  // Verify dist exists
  await safeRun(
    async () => {
      await promises.access(config.desktop.distPath);
    },
    logger,
    `Desktop dist directory does not exist at ${config.desktop.distPath}`,
  );

  logger.info("Desktop source code built successfully");

  // Exit
  await safeExit(logger, 0);
}

main();
