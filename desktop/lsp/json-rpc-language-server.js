const { logger } = require("../logger");
const { createUri } = require("../lsp");
const { JsonRpcProcess } = require("./json-rpc-process");
const path = require("path");

/**
 * @typedef {import("../type").ILanguageServer} ILanguageServer
 */

/**
 * Base class that implements common JSON-RPC LSP functionality.
 *
 * Convention:
 *
 * - Methods that implement {@link ILanguageServer} interface should be defined in subclasses
 * - Methods should start with `_` indicating it is a shared for all lsp impl can use
 * - Use Template strings
 *
 * @see {ILanguageServer} for the interface this class is designed to support
 */
class JsonRpcLanguageServer {
  /**
   * Holds a map of specific workspace folders normalized and abs and there rpc
   * @type {Map<string, JsonRpcProcess>}
   */
  #workSpaceRpcMap = new Map();

  /**
   * Start the language server for a given work space folder, spawn's the command for the given workspace if not already.
   * @param {string} command - The command like `gopls` or path to the xe binary to launch it like `c:\dev\bin\gopls.exe`
   * @param {string[]} args - Addtional arguments to pass to the spawned process like `["--stdio"]`
   * @param {string} wsf - The path to the workspace folder to run the lsp for
   * @returns {Promise<boolean>} If it could or could not start it
   */
  async _start(command, args, wsf) {
    let rc = new JsonRpcProcess(command, args);
    const _workSpaceFolder = path.normalize(path.resolve(wsf));

    try {
      if (this.#workSpaceRpcMap.has(_workSpaceFolder)) {
        logger.warn(
          `Language server already started for command: ${command} at workspace folder: ${_workSpaceFolder}`,
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

      logger.info(
        `Language server started for command: ${command} at workspace folder: ${wsf}`,
      );
      return true;
    } catch (error) {
      logger.error(
        `Failed to start language server. command: ${command} workspace folder ${wsf}`,
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
      const _workSpaceFolder = path.normalize(path.resolve(workSpaceFolder));
      const rc = this.#workSpaceRpcMap.get(_workSpaceFolder);

      if (!rc) {
        return false;
      }

      try {
        await rc.SendRequest("shutdown", {});
      } catch (error) {
        logger.error(`Shutdown requested hanged ${JSON.stringify(error)}`);
      }

      rc.Exit();
      rc.Shutdown();

      this.#workSpaceRpcMap.delete(_workSpaceFolder);

      logger.info(
        `Language server stoped for command: ${rc.GetCommand()} at workspace folder: ${workSpaceFolder}`,
      );
      return true;
    } catch (error) {
      logger.error(
        `Failed to stop language server for work space folder ${workSpaceFolder}`,
      );
      return false;
    }
  }

  /**
   * Stop all language servers active for all workspaces
   * @returns {Promise<import("../type").ILanguageServerStopAllResult[]>} All stop values for all workspaces
   */
  async _stopAll() {
    let wsfs = this.#workSpaceRpcMap.keys();
    /** @type {import("../type").ILanguageServerStopAllResult[]} */
    let result = [];

    for (const wsf of wsfs) {
      result.push({
        workSpaceFolder: wsf,
        result: await this._stop(wsf),
      });
    }

    return result;
  }

  /**
   * Check if a language server process is running for a given work space folder
   * @param {string} workSpaceFolder - The workspace folder to check
   * @returns {boolean} If it is or is not
   */
  _isRunning(workSpaceFolder) {
    return this.#workSpaceRpcMap.has(
      path.normalize(path.resolve(workSpaceFolder)),
    );
  }

  /**
   * Get a list of workspace folders that have a active LSP process running for them
   * @returns {string[]} List of workspace folder paths
   */
  _getWorkSpaceFolders() {
    return Array.from(this.#workSpaceRpcMap.keys());
  }

  /**
   * Open a document in the language server process
   * @param {string} workSpaceFolder - The workspace folder path
   * @param {string} filePath - The documents file path
   * @param {string} languageId - The language it for example `go` or `js`
   * @param {number} version - The documents version
   * @param {string} text - The documents full text content
   * @returns {void} Write's to the process
   */
  _didOpenTextDocument(workSpaceFolder, filePath, languageId, version, text) {
    try {
      const _workSpaceFolder = path.normalize(path.resolve(workSpaceFolder));

      const rc = this.#workSpaceRpcMap.get(_workSpaceFolder);
      if (!rc) {
        logger.warn(`No LSP process is running for ${_workSpaceFolder}`);
        return;
      }

      if (!rc.IsStarted()) {
        logger.error(
          `LSP process not yet started for command: ${rc.GetCommand()} workspace folder: ${_workSpaceFolder}`,
        );
        return;
      }

      rc.DidOpenTextDocument(createUri(filePath), languageId, version, text);
    } catch (error) {
      logger.error(
        `Failed to open document for workspace folder ${workSpaceFolder} filePath: ${filePath} languageId: ${languageId} version:${version} content-length: ${text.length}`,
      );
      logger.error(JSON.stringify(error));
    }
  }

  /**
   * Send document changes
   * @param {string} workSpaceFolder - The workspace folder path
   * @param {string} filePath - Path to the file that changed
   * @param {number} version - The documents version after changes
   * @param {import("vscode-languageserver-protocol").TextDocumentContentChangeEvent[]} changes - List of changes applied to the document
   * @returns {void} Nothing
   */
  _didChangeTextDocument(workSpaceFolder, filePath, version, changes) {
    try {
      const _workSpaceFolder = path.normalize(path.resolve(workSpaceFolder));

      const rc = this.#workSpaceRpcMap.get(_workSpaceFolder);
      if (!rc) {
        logger.warn(`No LSP process is running for ${_workSpaceFolder}`);
        return;
      }

      if (!rc.IsStarted()) {
        logger.error(
          `LSP process not yet started for command: ${rc.GetCommand()} workspace folder: ${_workSpaceFolder}`,
        );
        return;
      }

      rc.DidChangeTextDocument(createUri(filePath), version, changes);
    } catch (error) {
      logger.error(
        `Failed to sync document changes for workspace folder: ${workSpaceFolder} file: ${filePath} version: ${version} changes count: ${changes.length}`,
      );
      logger.error(JSON.stringify(error));
    }
  }
}

module.exports = { JsonRpcLanguageServer };
