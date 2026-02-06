const { Logger } = require("node-logy");

/**
 * Out logger instace
 */
const logger = new Logger({
  showCallSite: true,
  saveToLogFiles: true,
  timestampType: "short",
});

module.exports = { logger };
