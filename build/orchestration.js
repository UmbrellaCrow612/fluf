/**
 * Acts as the scripts that runs needed scripts in order they need to be ran for a final build artifact to be produced
 */

import { Logger } from "node-logy";
import { nodeLogyOptions, safeExit, createSafeRunOptions } from "./utils.js";

import { runCommand, safeRun } from "node-github-actions";

const logger = new Logger(nodeLogyOptions);

async function main() {
  logger.info("Started source code build");

  // Build desktop first
  await safeRun(
    async () => {
      await runCommand("node", ["stages/build_desktop.js"], {}, 60);
    },
    createSafeRunOptions(
      "Building desktop source code",
      "Desktop source code built successfully",
      "Failed to build desktop source code",
      logger,
    ),
  );

  // Build UI
  await safeRun(
    async () => {
      await runCommand("node", ["stages/build_ui.js"], {}, 60);
    },
    createSafeRunOptions(
      "Building UI source code",
      "UI source code built successfully",
      "Failed to build UI source code",
      logger,
    ),
  );

  // Run stage one
  await safeRun(
    async () => {
      await runCommand("node", ["stages/stage_one.js"], {}, 60);
    },
    createSafeRunOptions(
      "Running stage one",
      "Stage one completed successfully",
      "Failed to run stage one",
      logger,
    ),
  );

  // Run stage two
  await safeRun(
    async () => {
      await runCommand("node", ["stages/stage_two.js"], {}, 60);
    },
    createSafeRunOptions(
      "Running stage two",
      "Stage two completed successfully",
      "Failed to run stage two",
      logger,
    ),
  );

  // Run stage three
  await safeRun(
    async () => {
      await runCommand("node", ["stages/stage_three.js"], {}, 60);
    },
    createSafeRunOptions(
      "Running stage three",
      "Stage three completed successfully",
      "Failed to run stage three",
      logger,
    ),
  );

  // Run stage four
  await safeRun(
    async () => {
      await runCommand("node", ["stages/stage_four.js"], {}, 60);
    },
    createSafeRunOptions(
      "Running stage four",
      "Stage four completed successfully",
      "Failed to run stage four",
      logger,
    ),
  );

  logger.info("Finished build orchestration");

  await safeExit(logger);
}

main();
