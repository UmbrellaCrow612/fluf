/**
 * Acts as the scripts that runs needed scripts in order they need to be ran for a final build artifact to be produced
 */

import { Logger } from "node-logy";
import { runCommand, safeExit, safeRun } from "./utils.js";

const logger = new Logger({ saveToLogFiles: true, showCallSite: true });

async function main() {
  logger.info("Started source code build ");

  // Build desktop first
  logger.info("Building desktop source code");
  await safeRun(
    async () => {
      await runCommand("node", ["stages/build_desktop.js"], {}, 60);
    },
    logger,
    "Failed to build desktop source code",
  );

  // Build UI
  logger.info("Building UI source code");
  await safeRun(
    async () => {
      await runCommand("node", ["stages/build_ui.js"], {}, 60);
    },
    logger,
    "Failed to build UI source code",
  );

  // Run stage one
  logger.info("Running stage one");
  await safeRun(
    async () => {
      await runCommand("node", ["stages/stage_one.js"], {}, 60);
    },
    logger,
    "Failed to run stage one",
  );

  // Run stage two
  logger.info("Starting stage two");
  await safeRun(
    async () => {
      await runCommand("node", ["stages/stage_two.js"], {}, 60);
    },
    logger,
    "Failed to run stage two",
  );

  // Run stage three
  await safeRun(
    async () => {
      await runCommand("node", ["stages/stage_three.js"], {}, 60);
    },
    logger,
    "Failed to run stage three",
  );

  // Run stage four
  await safeRun(
    async () => {
      await runCommand("node", ["stages/stage_four.js"], {}, 60);
    },
    logger,
    "Failed to run stage four",
  );

  logger.info("Finished build orchestration");

  await safeExit(logger, 0);
}

main();
