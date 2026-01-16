const { logger } = require("../logger");
const { JsonRpcLanguageServer } = require("./language-server-protocol");

/**
 * @typedef {import("../type").ILanguageServer} l
 */

/**
 * The go language server
 * @implements {l}
 */
class GoLanguageServer extends JsonRpcLanguageServer {
  /**
   * @type {import("../type").ILanguageServerStart}
   */
  async Start(workSpaceFolder) {
    try {
      return this._start("gopls", ["serve"], workSpaceFolder);
    } catch (error) {
      logger.error(
        "Failed to start go language server " + JSON.stringify(error),
      );
      return false;
    }
  }
}

module.exports = {
  GoLanguageServer,
};
