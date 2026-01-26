const { NodeLogger } = require("node-logy");

/**
 * Out logger instace
 */
const logger = new NodeLogger({
  showStackTraceOfLogCalls: true,
});

module.exports = { logger };
