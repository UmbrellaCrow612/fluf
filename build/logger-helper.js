const { Logger } = require("node-logy");

/**
 * Clean exit, stops logger process and flushes logs then exists
 * @param {Logger} logger
 * @param {number} code
 */
async function cleanExit(logger, code = 0) {
  await logger.flush();
  await logger.shutdown();
  process.exit(code);
}

module.exports = { cleanExit };
