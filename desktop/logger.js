const { NodeLogger } = require("node-logy");

/**
 * Out logger instace
 */
const logger = new NodeLogger();

process.on("exit", () => {
  logger.flushLogsSync();
});

module.exports = { logger };
