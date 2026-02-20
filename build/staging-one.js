/**
 * Combines the source code of UI and desktop into a single dist
 */

const { Logger } = require("node-logy");
const { cleanExit } = require("./logger-helper");
const { DESKTOP_BUILD_OUTPUT_PATH } = require("./desktop_uris");
const fs = require("fs");
const { UI_BOULD_OUTPUT_PATH } = require("./ui_uris");
const { STAGE_ONE_BASE_DIR } = require("./stage_uris");

const logger = new Logger({ saveToLogFiles: true, showCallSite: true });

async function main() {
  logger.info("Starting stage one");

  logger.info(
    "Finding build output of desktop at: ",
    DESKTOP_BUILD_OUTPUT_PATH,
  );

  try {
    await fs.promises.access(DESKTOP_BUILD_OUTPUT_PATH);
  } catch (error) {
    logger.error("Desktop final build output path does not exit ", error);
    await cleanExit(logger, 1);
  }

  logger.info("Finding build output for ui at: ", UI_BOULD_OUTPUT_PATH);
  try {
    await fs.promises.access(UI_BOULD_OUTPUT_PATH);
  } catch (error) {
    logger.error("UI final build output path does not exit ", error);
    await cleanExit(logger, 1);
  }

  logger.info("Creating staging one folder at: ", STAGE_ONE_BASE_DIR);
  try {
    await fs.promises.mkdir(STAGE_ONE_BASE_DIR, { recursive: true });
  } catch (error) {
    await cleanExit(logger, 1);
  }

  logger.info("Stage one finished");
  await cleanExit(logger);
}

main();
