const path = require("path");
const fs = require("fs/promises");
const { runCmd } = require("./cmd-helper");
const { Logger } = require("node-logy");

const logger = new Logger({
  saveToLogFiles: true,
  showCallSite: true,
});

/**
 * Main entry point to build the UI source code
 */
async function main() {
  logger.info("Started build UI");

  const UI_BASE_PATH = path.join(__dirname, "../", "ui");

  logger.info("UI base path: ", UI_BASE_PATH);

  try {
    logger.info("Checking if ui base path exists");
    await fs.access(UI_BASE_PATH);
  } catch (error) {
    logger.error("Failed to check if UI base path exists: ", error);
    process.exit(1);
  }

  logger.info("Running build UI");
  try {
    await runCmd("npm", ["run", "build"], { cwd: UI_BASE_PATH });
  } catch (error) {
    logger.error("Failed to build ui source code: ", error);
    process.exit(1);
  }

  logger.info("UI build");

  await logger.flush();
  await logger.shutdown();
}

main();
