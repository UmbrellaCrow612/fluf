/**
 * @typedef {import("../type").ILanguageServer} l
 */

const { logger } = require("../logger");
const { createUri } = require("../lsp");
const { JsonRpcProcess } = require("./json-rpc-process");
const path = require("path");

/**
 * Base class that impl common json rpc lsp
 */
class JsonRpcLanguageServer {
  /**
   * Holds a map of specific workspace folders normalized and abs and there rpc
   * @type {Map<string, JsonRpcProcess>}
   */
  #workSpaceRpcMap = new Map();

  /** @type {import("../type").LanguageServerStart} */
  async _start(command, args, wsf) {
    let rc = new JsonRpcProcess(command, args);
    const _workSpaceFolder = path.normalize(path.resolve(wsf));

    try {
      if (this.#workSpaceRpcMap.has(_workSpaceFolder)) {
        logger.warn(
          "Language server already started for command: " +
            command +
            " at workspace folder: " +
            _workSpaceFolder,
        );
        return true;
      }
      this.#workSpaceRpcMap.set(_workSpaceFolder, rc);

      rc.Start();

      /** @type {import("vscode-languageserver-protocol").InitializeParams} */
      let params = {
        capabilities: {},
        processId: rc.GetPid() ?? null,
        clientInfo: {
          name: path.basename(_workSpaceFolder),
          version: "1",
        },
        workspaceFolders: [
          {
            name: path.basename(_workSpaceFolder),
            uri: createUri(_workSpaceFolder),
          },
        ],
        rootUri: createUri(_workSpaceFolder),
      };

      await rc.SendRequest("initialize", params);
      rc.Initialized();

      return true;
    } catch (error) {
      logger.error(
        "Failed to start language server. command: " +
          command +
          " workspace folder " +
          wsf,
      );
      logger.error(JSON.stringify(error));

      rc.Shutdown();
      this.#workSpaceRpcMap.delete(_workSpaceFolder);

      return false;
    }
  }

  /**
   * Stop the language server at a given workspace folder if one was started
   * @param {string} workSpaceFolder - The workspace folder to stop
   * @returns {Promise<boolean>}
   */
  async _stop(workSpaceFolder) {
    try {


        return true
    } catch (error) {
      logger.error(
        "Failed to stop language server for work space folder " +
          workSpaceFolder,
      );
      return false;
    }
  }
}

module.exports = { JsonRpcLanguageServer };
