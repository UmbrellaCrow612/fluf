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
    try {
      const _workSpaceFolder = path.normalize(path.resolve(wsf));
      if (this.#workSpaceRpcMap.has(_workSpaceFolder)) {
        logger.warn(
          "Language server already started for command: " +
            command +
            " at workspace folder: " +
            _workSpaceFolder,
        );
        return true;
      }

      let rc = new JsonRpcProcess(command, args);

      rc.Start();

      /** @type {import("vscode-languageserver-protocol").InitializeParams} */
      let params = {
        capabilities: {
          experimental: true,
        },
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

      rc.Initialize();

      this.#workSpaceRpcMap.set(_workSpaceFolder, rc);

      return true;
    } catch (error) {
      logger.error(
        "Failed to start language server. command: " +
          command +
          " workspace folder " +
          wsf,
      );
      logger.error(JSON.stringify(error));
      return false;
    }
  }
}

module.exports = { JsonRpcLanguageServer };
