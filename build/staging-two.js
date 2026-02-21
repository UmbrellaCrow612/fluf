/**
 * Second stage that runs after stage one and asars stage one output then deletes stage one folder
 */

const { Logger } = require("node-logy");
const fs = require("fs/promises");
const { cleanExit } = require("./logger-helper");
const { STAGE_ONE_BASE_DIR, STAGE_TWO_ASAR_PATH } = require("./stage_uris");
const { createPackage } = require("@electron/asar");

const logger = new Logger({ saveToLogFiles: true, showCallSite: true });

async function main() {
  try {
    logger.info("Starting stage two");

    logger.info("Checking if path exists: ", STAGE_ONE_BASE_DIR);
    await fs.access(STAGE_ONE_BASE_DIR);

    logger.info("Checking for previous ASAR at: ", STAGE_TWO_ASAR_PATH);
    try {
      await fs.access(STAGE_TWO_ASAR_PATH);
      logger.info("Previous ASAR found, deleting...");
      await fs.unlink(STAGE_TWO_ASAR_PATH);
      logger.info("Previous ASAR deleted successfully");
    } catch (/** @type {any}*/ error) {
      if (error.code === "ENOENT") {
        logger.info("No previous ASAR found, continuing...");
      } else {
        await cleanExit(logger, 1);
      }
    }

    logger.info("Performing asar to: ", STAGE_TWO_ASAR_PATH);

    try {
      await createPackage(STAGE_ONE_BASE_DIR, STAGE_TWO_ASAR_PATH);
    } catch (error) {
      logger.error("Failed asar: ", error);
      await cleanExit(logger, 1);
    }

    logger.info("Finishes asar to: ", STAGE_TWO_ASAR_PATH);
    await cleanExit(logger);
  } catch (error) {
    logger.error("Failed stage two: ", error);
    await cleanExit(logger, 1);
  }
}

main();
