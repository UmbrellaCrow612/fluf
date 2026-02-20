const path = require("path");
const fs = require("fs/promises");
const { runCmd } = require("./cmd-helper");
const { Logger } = require("node-logy");
const { cleanExit } = require("./logger-helper");

const logger = new Logger({
  saveToLogFiles: true,
  showCallSite: true,
});

/**
 * Main entry point to build the desktop source code
 */
async function main() {
  logger.info("Started build desktop");


  logger.info("Desktop base path: ", DESKTOP_BASE_PATH);

  try {
    logger.info("Checking if desktop base path exists");
    await fs.access(DESKTOP_BASE_PATH);
  } catch (error) {
    logger.error("Failed to check if desktop base path exists: ", error);
    await cleanExit(logger, 1);
  }

  logger.info("Running build desktop");
  try {
    await runCmd("npm", ["run", "build"], { cwd: DESKTOP_BASE_PATH });
  } catch (error) {
    logger.error("Failed to build desktop source code: ", error);
    await cleanExit(logger, 1);
  }

  logger.info("Desktop build completed");

  await cleanExit(logger);
}

main();
