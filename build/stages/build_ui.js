import { Logger } from "node-logy";
import { promises } from "node:fs";
import { safeExit, safeRun, runCommand } from "../utils.js";
import { config } from "../config.js";

const logger = new Logger({ saveToLogFiles: true, showCallSite: true });

async function main() {
  logger.info("Building UI source code");

  // check UI base path exists
  await safeRun(
    async () => {
      await promises.access(config.ui.basePath);
    },
    logger,
    "UI base path does not exist",
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
    logger,
    `Failed to build UI source code at ${config.ui.basePath}`,
  );

  // Verify dist exists
  await safeRun(
    async () => {
      await promises.access(config.ui.distPath);
    },
    logger,
    `UI dist does not exit at ${config.ui.distPath}`,
  );

  logger.info("UI source code built");

  // Exit
  await safeExit(logger, 0);
}

main();
