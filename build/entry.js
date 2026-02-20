const { Logger } = require("node-logy");
const { runCmd } = require("./cmd-helper");
const { cleanExit } = require("./logger-helper");

const logger = new Logger({
  saveToLogFiles: true,
  showCallSite: true,
});

/**
 * Main entry file to start the build proccess
 */
async function main() {
  logger.info("Building source code ");

  logger.info("Starting build process for UI");
  try {
    await runCmd("node", ["build-ui.js"])
  } catch (error) {
    logger.info("Build process for UI failed");
    await cleanExit(logger, 1);
  }

  logger.info("Starting build proccess for Desktop")
   try {
    await runCmd("node", ["build-desktop.js"])
  } catch (error) {
    logger.info("Build process for Desktop failed");
    await cleanExit(logger, 1);
  }

  logger.info("Finished build proccess")

  logger.info("Starting stage one")
  try {
    await runCmd("node", ["staging-one.js"])
  } catch (error) {
    logger.error("Failed stage one: ", error)
    await cleanExit(logger, 1)
  }
  

  logger.info("Finished build")
  await cleanExit(logger)
}

main();
