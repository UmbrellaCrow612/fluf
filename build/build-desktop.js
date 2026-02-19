const path = require("path");
const fs = require("fs/promises");
const { runCmd } = require("./cmd-helper");
const { Logger } = require("node-logy");

const logger = new Logger({
  saveToLogFiles: true,
  showCallSite: true,
});

/**
 * Main entry point to build the desktop source code
 */
async function main() {
  logger.info("Started build desktop");

  const DESKTOP_BASE_PATH = path.join(__dirname, "../", "desktop");

  logger.info("Desktop base path: ", DESKTOP_BASE_PATH);

  try {
    logger.info("Checking if desktop base path exists");
    await fs.access(DESKTOP_BASE_PATH);
  } catch (error) {
    logger.error("Failed to check if desktop base path exists: ", error);
    process.exit(1);
  }

  logger.info("Running build desktop");
  try {
    await runCmd("npm", ["run", "build"], { cwd: DESKTOP_BASE_PATH });
  } catch (error) {
    logger.error("Failed to build desktop source code: ", error);
    process.exit(1);
  }

  logger.info("Desktop build completed");

  await logger.flush();
  await logger.shutdown();
}

main();