/**
 * Combines the source code of UI and desktop as well as the deps of desktop such as it's binarys and node_modules needed
 */

const { Logger } = require("node-logy");
const { cleanExit } = require("./logger-helper");

const logger = new Logger({ saveToLogFiles: true, showCallSite: true });

async function main() {
  logger.info("Starting stage one");


  await cleanExit(logger);
}

main();
