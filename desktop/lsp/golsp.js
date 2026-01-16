const binmanResolve = require("umbr-binman");
const { logger } = require("../logger");
const { JsonRpcLanguageServer } = require("./language-server-protocol");
const { binPath } = require("../packing");

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
      let exePath = await binmanResolve("gopls", ["gopls"], binPath());
      if (!exePath) {
        throw new Error("No gopls exe path");
      }

      return this._start(exePath, ["serve"], workSpaceFolder);
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