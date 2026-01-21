const { logger, logError } = require("../logger");
const { JsonRpcProcess } = require("./json-rpc-process");
const path = require("path");
const { createUri } = require("./uri");

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
 * - Validate params types and values if they do not match throw typeErrors
 * - Re throw any errors after logging them
 *
 * @see {ILanguageServer} for the interface this class is designed to support
 */
class JsonRpcLanguageServer {
  /**
   * Required for LSP to work
   * @param {import("../type").getMainWindow} getMainWindow - Used to fetch the main window ref
   * @param {import("../type").languageId} languageId - The specific language this is for
   */
  constructor(getMainWindow, languageId) {
    if (typeof getMainWindow !== "function")
      throw new TypeError("getMainWindow is not a function");

    if (typeof languageId !== "string")
      throw new TypeError("languageId must be a non empty string");

    this.#getMainWindow = getMainWindow;
    this.#languageId = languageId;
    this.#mainWindowRef = this.#getMainWindow();
  }

  /**
   * Holds a map of specific workspace folders normalized and abs and there rpc
   * @type {Map<string, JsonRpcProcess>}
   */
  #workSpaceRpcMap = new Map();

  /**
   * Used to fetch the main widow - this is becuase on init it's null
   * @type {import("../type").getMainWindow | null}
   */
  #getMainWindow = null;

  /**
   * Holds the language this LSP is for exmaple `go` or `js` etc
   * @type {import("../type").languageId | null}
   */
  #languageId = null;

  /**
   * Refrence to the main window to allow sending messages without a event
   * @type {import("electron").BrowserWindow | null}
   */
  #mainWindowRef = null;

  /**
   * Start the language server for a given work space folder, spawn's the command for the given workspace if not already.
   * @param {string} command - The command like `gopls` or path to the xe binary to launch it like `c:\dev\bin\gopls.exe`
   * @param {string[]} args - Addtional arguments to pass to the spawned process like `["--stdio"]`
   * @param {string} wsf - The path to the workspace folder to run the lsp for
   * @returns {Promise<boolean>} If it could or could not start it
   */
  async _start(command, args, wsf) {
    if (!command || typeof command !== "string")
      throw new TypeError("command must be a non-empty string");

    if (!args || !Array.isArray(args))
      throw new TypeError("args must be an array");

    if (!wsf || typeof wsf !== "string")
      throw new TypeError("workSpaceFolder must be a non-empty string");

    if (!this.#getMainWindow)
      throw new Error("getMainWindow is null cannot get the main window");

    if (!this.#mainWindowRef) {
      this.#mainWindowRef = this.#getMainWindow(); // we do this becuase we dont know when main widow becomes available
    }

    if (!this.#mainWindowRef)
      throw new Error("mainWindowRef is null cannot sent events");

    if (!this.#languageId) throw new Error("languageId is null");

    let rc = new JsonRpcProcess(
      command,
      args,
      this.#getMainWindow,
      wsf,
      this.#languageId,
    );
    const _workSpaceFolder = path.normalize(path.resolve(wsf));

    try {
      if (this.#workSpaceRpcMap.has(_workSpaceFolder)) {
        logger.warn(
          `Language server already started for command: ${command} at workspace folder: ${_workSpaceFolder}`,
        );
        return true;
      }
      this.#workSpaceRpcMap.set(_workSpaceFolder, rc);

      await rc.Start();

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

      // notify ui lsp ready for given lang and workspace
      this.#mainWindowRef.webContents.send(
        "lsp:on:ready",
        this.#languageId,
        wsf,
      );

      logger.info(
        `Language server started for command: ${command} at workspace folder: ${wsf}`,
      );
      return true;
    } catch (error) {
      logError(
        error,
        `Failed to start language server. command: ${command} workspace folder ${wsf}`,
      );

      rc.Shutdown();
      this.#workSpaceRpcMap.delete(_workSpaceFolder);

      throw error;
    }
  }

  /**
   * Stop the language server at a given workspace folder if one was started
   * @param {string} workSpaceFolder - The workspace folder to stop
   * @returns {Promise<boolean>} If it could or could not
   */
  async _stop(workSpaceFolder) {
    if (!workSpaceFolder || typeof workSpaceFolder !== "string")
      throw new TypeError("workspace-folder must be a non empty string ");

    try {
      const _workSpaceFolder = path.normalize(path.resolve(workSpaceFolder));
      const rc = this.#workSpaceRpcMap.get(_workSpaceFolder);

      if (!rc) {
        return true;
      }

      try {
        await rc.SendRequest("shutdown", {});
      } catch (/** @type {any}*/ error) {
        logError(error, `Shutdown requested hanged`);
      }

      rc.Exit();
      rc.Shutdown();

      this.#workSpaceRpcMap.delete(_workSpaceFolder);

      logger.info(
        `Language server stopped for command: ${rc.GetCommand()} at workspace folder: ${workSpaceFolder}`,
      );
      return true;
    } catch (/** @type {any}*/ error) {
      logError(
        error,
        `Failed to stop language server for work space folder ${workSpaceFolder}`,
      );

      throw error;
    }
  }

  /**
   * Stop all language servers active for all workspaces
   * @returns {Promise<import("../type").ILanguageServerStopAllResult[]>} All stop values for all workspaces
   */
  async _stopAll() {
    let wsfs = Array.from(this.#workSpaceRpcMap.keys());
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
    if (!workSpaceFolder || typeof workSpaceFolder !== "string")
      throw new TypeError("workSpaceFolder must be a non-empty string");

    if (!filePath || typeof filePath !== "string")
      throw new TypeError("filePath must be a non-empty string");

    if (!languageId || typeof languageId !== "string")
      throw new TypeError("languageId must be a non-empty string");

    if (typeof version !== "number" || version < 0)
      throw new TypeError("version must be a non-negative number");

    if (typeof text !== "string") throw new TypeError("text must be a string");

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
      logError(
        error,
        `Failed to open document for workspace folder ${workSpaceFolder} filePath: ${filePath} languageId: ${languageId} version:${version} content-length: ${text.length}`,
      );

      throw error;
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
    if (!workSpaceFolder || typeof workSpaceFolder !== "string")
      throw new TypeError("workSpaceFolder must be a non-empty string");

    if (!filePath || typeof filePath !== "string")
      throw new TypeError("filePath must be a non-empty string");

    if (typeof version !== "number" || version < 0)
      throw new TypeError("version must be a non-negative number");

    if (!Array.isArray(changes))
      throw new TypeError("changes must be an array");

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
      logError(
        error,
        `Failed to sync document changes for workspace folder: ${workSpaceFolder} file: ${filePath} version: ${version} changes count: ${changes.length}`,
      );
      throw error;
    }
  }

  /**
   * Close a document that was opened
   * @param {string} workSpaceFolder - The workspace where the file lives
   * @param {string} filePath - The path to the file to close
   * @returns {void} Nothing
   */
  _didCloseTextDocument(workSpaceFolder, filePath) {
    if (typeof workSpaceFolder !== "string")
      throw new TypeError("workSpaceFolder must be a non empty string");
    if (typeof filePath !== "string")
      throw new TypeError("filePath must be a non empty string");

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

      rc.DidCloseTextDocument(createUri(filePath));
    } catch (error) {
      logError(
        error,
        `Failed to close document work workspace folder: ${workSpaceFolder} file: ${filePath}`,
      );
      throw error;
    }
  }

  /**
   * Get hover information
   * @param {string} workSpaceFolder - The workspace where the file lives
   * @param {string} filePath - The path to the file to close
   * @param {import("vscode-languageserver-protocol").Position} position - The position at which to get the hover information
   * @returns {Promise<import("vscode-languageserver-protocol").Hover>} The hover information
   */
  _hover(workSpaceFolder, filePath, position) {
    if (typeof workSpaceFolder !== "string")
      throw new TypeError("workSpaceFolder must be a non empty string");
    if (typeof filePath !== "string")
      throw new TypeError("filePath must be a non empty string");
    if (typeof position !== "object")
      throw new TypeError("position must be a object");

    try {
      const _workSpaceFolder = path.normalize(path.resolve(workSpaceFolder));

      const rc = this.#workSpaceRpcMap.get(_workSpaceFolder);
      if (!rc) {
        logger.warn(`No LSP process is running for ${_workSpaceFolder}`);
        return Promise.reject(
          `No LSP process is running for ${_workSpaceFolder}`,
        );
      }

      if (!rc.IsStarted()) {
        logger.error(
          `LSP process not yet started for command: ${rc.GetCommand()} workspace folder: ${_workSpaceFolder}`,
        );
        return Promise.reject(
          `LSP process not yet started for command: ${rc.GetCommand()} workspace folder: ${_workSpaceFolder}`,
        );
      }

      /** @type {import("vscode-languageserver-protocol").HoverParams} */
      let params = {
        position,
        textDocument: {
          uri: createUri(filePath),
        },
      };

      return rc.SendRequest("textDocument/hover", params);
    } catch (error) {
      logError(
        error,
        `Failed to get hover information for workspace: ${workSpaceFolder} file: ${filePath}, pos: ${position.character} ${position.line}`,
      );

      throw error;
    }
  }

  /**
   * Get completion suggestions
   * @param {string} workSpaceFolder - The workspace where the file lives
   * @param {string} filePath - The path to the file
   * @param {import("vscode-languageserver-protocol").Position} position - The position at which to get completions
   * @returns {Promise<import("vscode-languageserver-protocol").CompletionList | null>} The completion items or list
   */
  _completion(workSpaceFolder, filePath, position) {
    if (typeof workSpaceFolder !== "string")
      throw new TypeError("workSpaceFolder must be a non empty string");
    if (typeof filePath !== "string")
      throw new TypeError("filePath must be a non empty string");
    if (typeof position !== "object")
      throw new TypeError("position must be a object");

    try {
      const _workSpaceFolder = path.normalize(path.resolve(workSpaceFolder));

      const rc = this.#workSpaceRpcMap.get(_workSpaceFolder);
      if (!rc) {
        logger.warn(`No LSP process is running for ${_workSpaceFolder}`);
        return Promise.reject(
          `No LSP process is running for ${_workSpaceFolder}`,
        );
      }

      if (!rc.IsStarted()) {
        logger.error(
          `LSP process not yet started for command: ${rc.GetCommand()} workspace folder: ${_workSpaceFolder}`,
        );
        return Promise.reject(
          `LSP process not yet started for command: ${rc.GetCommand()} workspace folder: ${_workSpaceFolder}`,
        );
      }

      /** @type {import("vscode-languageserver-protocol").CompletionParams} */
      let params = {
        position,
        textDocument: {
          uri: createUri(filePath),
        },
      };

      return rc.SendRequest("textDocument/completion", params);
    } catch (error) {
      logError(
        error,
        `Failed to get completions for workspace: ${workSpaceFolder} file: ${filePath}, pos: ${position.character} ${position.line}`,
      );

      throw error;
    }
  }
}

module.exports = { JsonRpcLanguageServer };
