/**
 * Acts as the scripts that runs needed scripts in order they need to be ran for a final build artifact to be produced
 */

import { Logger } from "node-logy";
import { nodeLogyOptions, safeExit } from "./utils.js";

import { runCommand, safeRun } from "node-github-actions";

const logger = new Logger(nodeLogyOptions);

safeRun(
  async () => {
    // Build desktop
    logger.info("Building desktop source code");
    await runCommand("node", ["stages/build_desktop.js"], {}, 60);
    logger.info("Desktop source code built successfully");

    // Build UI
    logger.info("Building UI source code");
    await runCommand("node", ["stages/build_ui.js"], {}, 60);
    logger.info("UI source code built successfully");

    // Run stage one
    logger.info("Running stage one");
    await runCommand("node", ["stages/stage_one.js"], {}, 60);
    logger.info("Stage one completed successfully");

    // Run stage two
    logger.info("Running stage two");
    await runCommand("node", ["stages/stage_two.js"], {}, 60);
    logger.info("Stage two completed successfully");

    // Run stage three
    logger.info("Running stage three");
    await runCommand("node", ["stages/stage_three.js"], {}, 60);
    logger.info("Stage three completed successfully");

    // Run stage four
    logger.info("Running stage four");
    await runCommand("node", ["stages/stage_four.js"], {}, 60);
    logger.info("Stage four completed successfully");

    logger.info("Build orchestration completed successfully");
  },
  {
    exitFailCode: 1,
    exitOnFailed: true,
    onBefore: () => {
      logger.info("Started build orchestration");
    },
    onAfter: async () => {
      await safeExit(logger);
    },
    onFail: async (err) => {
      logger.error("Build orchestration failed ", err);
      await safeExit(logger);
    },
    timeoutMs: 10 * 60 * 1000,
  },
);
