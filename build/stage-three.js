const { Logger } = require("node-logy");
const { cleanExit } = require("./logger-helper");
const fs = require("fs/promises");
const {
  STAGE_THREE_DIST,
  ELECTRON_DIST_DOWNLOADED,
  STAGE_THREE_DIST_RESOURCE,
} = require("./stage_three_uris");
const { STAGE_TWO_ASAR_PATH } = require("./stage_uris");

const logger = new Logger({ saveToLogFiles: true, showCallSite: true });

/**
 * Downloads the electron binarys based on the current platform that is running and arch
 *
 * NOTE having run npm ci needed eleectron binarys would have been downloaded to node modules for given machine
 */
async function main() {
  try {
    logger.info("Started stage three");

    try {
      await fs.access(STAGE_THREE_DIST);
      logger.info(`Found existing dist at ${STAGE_THREE_DIST}, deleting...`);
      await fs.rm(STAGE_THREE_DIST, { recursive: true, force: true });
      logger.info("Successfully deleted existing dist");
    } catch (/** @type {any}*/ error) {
      if (error.code !== "ENOENT") {
        logger.error("STAGE_THREE_DIST error: ", error);
        await cleanExit(logger, 1);
      }
      logger.info("No existing dist found, proceeding...");
    }

    try {
      await fs.access(ELECTRON_DIST_DOWNLOADED);
    } catch (error) {
      logger.error(
        "Failed to find electron binarys: ",
        error,
        ELECTRON_DIST_DOWNLOADED,
      );
      await cleanExit(logger, 1);
    }

    logger.info(
      "Copying: ",
      ELECTRON_DIST_DOWNLOADED,
      "to: ",
      STAGE_THREE_DIST,
    );

    try {
      await fs.cp(ELECTRON_DIST_DOWNLOADED, STAGE_THREE_DIST, {
        recursive: true,
      });
    } catch (error) {
      logger.error(
        "Failed to copy from: ",
        ELECTRON_DIST_DOWNLOADED,
        " to: ",
        STAGE_THREE_DIST,
        error,
      );
      await cleanExit(logger, 1);
    }

    logger.info("Copied electron binarys to ", STAGE_THREE_DIST);

    logger.info(
      "Moving stage two app asar file to stage three from: ",
      STAGE_TWO_ASAR_PATH,
      " to: ",
      STAGE_THREE_DIST_RESOURCE,
    );

    await cleanExit(logger);
  } catch (error) {
    logger.error("Failed stage three: ", error);
    await cleanExit(logger, 1);
  }
}

main();
