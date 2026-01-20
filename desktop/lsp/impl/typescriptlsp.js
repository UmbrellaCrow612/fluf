const { logger, logError } = require("../../logger");
const { getTypescriptServerPath } = require("../../packing");
const path = require("path");
const { TypeScriptProcess } = require("../typescript-process");
const { protocol } = require("typescript").server;

/**
 * @typedef {import("../../type").ILanguageServer} ILanguageServer
 */

/**
 * The typescript language server implementation using following json RPC protocol design
 * 
 * @implements {ILanguageServer}
 *
 */
class TypeScriptLanguageServer {
  /**
   * Fetches the main window
   * @type {import("../../type").getMainWindow | null}
   */
  #getMainWindow = null;

  /**
   * The specific language id for exmaple `typescript`
   * @type {import("../../type").languageId | null}
   */
  #languageId = null;

  /**
   * Reference to the main window
   * @type {import("electron").BrowserWindow | null}
   */
  #mainWindowRef = null;

  /**
   * Holds a map of workspace and it's process running for it
   * @type {Map<string, import("../typescript-process").TypeScriptProcess>}
   */
  #workSpaceProcessMap = new Map();

  /**
   * Required for typescript LSP to work
   * @param {import("../../type").getMainWindow} getMainWindow - Used to fetch the main window
   * @param {import("../../type").languageId} languageId - The specific language id for exmaple `typescript`
   */
  constructor(getMainWindow, languageId) {
    if (typeof getMainWindow !== "function")
      throw new Error("getMainWindow must be a function");

    if (typeof languageId !== "string" || languageId.trim() === "")
      throw new Error("languageId must be a non-empty string");

    this.#getMainWindow = getMainWindow;
    this.#languageId = languageId;
    this.#mainWindowRef = this.#getMainWindow(); // we do this because we don't know when the main window will be available
  }

  /**
   * @type {import("../../type").ILanguageServerStart}
   */
  async Start(workSpaceFolder) {
    if (typeof workSpaceFolder !== "string" || workSpaceFolder.trim() === "")
      throw new Error("workSpaceFolder must be a non-empty string");

    if (typeof this.#getMainWindow !== "function")
      throw new Error("getMainWindow must be a function");

    if (typeof this.#languageId !== "string" || this.#languageId.trim() === "")
      throw new Error("languageId must be a non-empty string");

    this.#mainWindowRef = this.#getMainWindow();

    if (typeof this.#mainWindowRef !== "object" || this.#mainWindowRef === null)
      throw new Error("mainWindowRef must be a valid BrowserWindow");

    try {
      let exePath = getTypescriptServerPath();
      if (!exePath) {
        throw new Error("No typescript exe path");
      }

      const _workSpaceFolder = path.normalize(path.resolve(workSpaceFolder));

      if (this.#workSpaceProcessMap.has(_workSpaceFolder)) {
        logger.warn(
          `Typescript server already started for workspace: ${_workSpaceFolder}`,
        );
        return true;
      }

      const process = new TypeScriptProcess(
        "node", // we use node to run the typescript server because it's a js file
        [exePath],
        _workSpaceFolder,
        this.#languageId,
        this.#getMainWindow,
      );

      this.#workSpaceProcessMap.set(_workSpaceFolder, process);

      await process.Start(); // we don't need to send a json rpc initialization here because the typescript server doesn't require it

      // notify ui lsp ready for given lang and workspace
      this.#mainWindowRef.webContents.send(
        "lsp:on:ready",
        this.#languageId,
        workSpaceFolder,
      );

      logger.info(`Started typescript lsp for workspace: ${workSpaceFolder}`);

      return true;
    } catch (error) {
      logError(
        error,
        `Failed to start typescript lsp for workspace: ${workSpaceFolder}`,
      );

      this.#workSpaceProcessMap.delete(
        path.normalize(path.resolve(workSpaceFolder)),
      );

      throw error;
    }
  }

  /**
   * @type {import("../../type").ILanguageServerStop}
   */
  async Stop(workSpaceFolder) {
    if (typeof workSpaceFolder !== "string" || workSpaceFolder.trim() === "")
      throw new Error("workSpaceFolder must be a non-empty string");

    const _workSpaceFolder = path.normalize(path.resolve(workSpaceFolder));

    try {
      if (!this.#workSpaceProcessMap.has(_workSpaceFolder)) {
        logger.warn(
          `Typescript server not running for workspace: ${_workSpaceFolder}`,
        );
        return true;
      }

      const process = this.#workSpaceProcessMap.get(_workSpaceFolder);
      if (!process) {
        this.#workSpaceProcessMap.delete(_workSpaceFolder);
        logger.warn(
          `Typescript server process reference missing for workspace: ${_workSpaceFolder}`,
        );
        return true;
      }

      await process.SendRequest(
        protocol.CommandTypes.Exit,
        {},
        { expectResponse: false },
      );

      this.#workSpaceProcessMap.delete(_workSpaceFolder);

      logger.info(`Stopped typescript lsp for workspace: ${_workSpaceFolder}`);

      return true;
    } catch (error) {
      logError(
        error,
        `Failed to stop typescript lsp for workspace: ${_workSpaceFolder}`,
      );

      throw error;
    }
  }

  /**
   * @type {import("../../type").ILanguageServerCompletion}
   */
  async Completion(workSpaceFolder, filePath, position) {
    if (typeof workSpaceFolder !== "string" || workSpaceFolder.trim() === "")
      throw new Error("workSpaceFolder must be a non-empty string");

    if (typeof filePath !== "string" || filePath.trim() === "")
      throw new Error("filePath must be a non-empty string");

    if (typeof position !== "object")
      throw new Error("position must be a valid object");

    try {
      const _workSpaceFolder = path.normalize(path.resolve(workSpaceFolder));

      if (!this.#workSpaceProcessMap.has(_workSpaceFolder)) {
        return Promise.reject(
          new Error(
            `Typescript server not running for workspace: ${_workSpaceFolder}`,
          ),
        );
      }

      const process = this.#workSpaceProcessMap.get(_workSpaceFolder);
      if (!process) {
        this.#workSpaceProcessMap.delete(_workSpaceFolder);
        return Promise.reject(
          new Error(
            `Typescript server process reference missing for workspace: ${_workSpaceFolder}`,
          ),
        );
      }

      if (!process.IsRunning()) {
        return Promise.reject(
          new Error(
            `Typescript server process not running for workspace: ${_workSpaceFolder}`,
          ),
        );
      }

      /**
       * @type {import("typescript").server.protocol.CompletionsRequestArgs}
       */
      let params = {
        file: path.normalize(path.resolve(filePath)),
        line: position.line + 1, // typescript server uses 1-based line numbers
        offset: position.character + 1, // typescript server uses 1-based character numbers
      };

      /**
       * @type {import("typescript").server.protocol.CompletionInfoResponse["body"]}
       */
      let responseBody = await process.SendRequest(
        protocol.CommandTypes.CompletionInfo,
        params,
      );

      if (!responseBody) {
        throw new Error("No response body from completionInfo request");
      }

      /**
       * @type {import("vscode-languageserver-types").CompletionList}
       */
      let lspCompletionResponse = {
        isIncomplete: true,
        items: responseBody.entries.map((entry) => {
          // TODO enhance mapping
          return {
            label: entry.name,
          };
        }),
      };

      return lspCompletionResponse;
    } catch (error) {
      logError(
        error,
        `Failed to get completion for workspace: ${workSpaceFolder} file: ${filePath}`,
      );

      throw error;
    }
  }

  /**
   * @type {import("../../type").ILanguageServerDidChangeTextDocument}
   */
  DidChangeTextDocument(workSpaceFolder, filePath, version, changes) {
    if (typeof workSpaceFolder !== "string" || workSpaceFolder.trim() === "")
      throw new Error("workSpaceFolder must be a non-empty string");

    if (typeof filePath !== "string" || filePath.trim() === "")
      throw new Error("filePath must be a non-empty string");

    if (typeof version !== "number" || version < 0)
      throw new Error("version must be a non-negative number");

    if (!Array.isArray(changes))
      throw new Error("changes must be a valid array");

    try {
      const _workSpaceFolder = path.normalize(path.resolve(workSpaceFolder));

      if (!this.#workSpaceProcessMap.has(_workSpaceFolder)) {
        logger.warn(
          `Typescript server not running for workspace: ${_workSpaceFolder}`,
        );
        return;
      }

      const process = this.#workSpaceProcessMap.get(_workSpaceFolder);
      if (!process) {
        logger.warn(
          `Typescript server process reference missing for workspace: ${_workSpaceFolder}`,
        );
        return;
      }

      if (!process.IsRunning()) {
        logger.warn(
          `Typescript server process not running for workspace: ${_workSpaceFolder}`,
        );
        return;
      }

      process.DidChangeTextDocument(filePath, version, changes);
    } catch (error) {
      logError(
        error,
        `Failed to send didChangeTextDocument for workspace: ${workSpaceFolder} file: ${filePath}`,
      );

      throw error;
    }
  }

  /**
   * @type {import("../../type").ILanguageServerDidCloseTextDocument}
   */
  DidCloseTextDocument(workSpaceFolder, filePath) {
    if (typeof workSpaceFolder !== "string" || workSpaceFolder.trim() === "")
      throw new Error("workSpaceFolder must be a non-empty string");

    if (typeof filePath !== "string" || filePath.trim() === "")
      throw new Error("filePath must be a non-empty string");

    try {
      const _workSpaceFolder = path.normalize(path.resolve(workSpaceFolder));

      if (!this.#workSpaceProcessMap.has(_workSpaceFolder)) {
        logger.warn(
          `Typescript server not running for workspace: ${_workSpaceFolder}`,
        );
        return;
      }

      const process = this.#workSpaceProcessMap.get(_workSpaceFolder);
      if (!process) {
        logger.warn(
          `Typescript server process reference missing for workspace: ${_workSpaceFolder}`,
        );
        return;
      }

      if (!process.IsRunning()) {
        logger.warn(
          `Typescript server process not running for workspace: ${_workSpaceFolder}`,
        );
        return;
      }

      process.DidCloseTextDocument(filePath);
    } catch (error) {
      logError(
        error,
        `Failed to send didCloseTextDocument for workspace: ${workSpaceFolder} file: ${filePath}`,
      );

      throw error;
    }
  }

  /**
   * @type {import("../../type").ILanguageServerDidOpenTextDocument}
   */
  DidOpenTextDocument(workspaceFolder, filePath, languageId, version, text) {
    if (typeof workspaceFolder !== "string" || workspaceFolder.trim() === "")
      throw new Error("workspaceFolder must be a non-empty string");

    if (typeof filePath !== "string" || filePath.trim() === "")
      throw new Error("filePath must be a non-empty string");

    if (typeof languageId !== "string" || languageId.trim() === "")
      throw new Error("languageId must be a non-empty string");

    if (typeof version !== "number" || version < 0)
      throw new Error("version must be a non-negative number");

    if (typeof text !== "string") throw new Error("text must be a string");

    try {
      const _workSpaceFolder = path.normalize(path.resolve(workspaceFolder));

      if (!this.#workSpaceProcessMap.has(_workSpaceFolder)) {
        logger.warn(
          `Typescript server not running for workspace: ${_workSpaceFolder}`,
        );
        return;
      }

      const process = this.#workSpaceProcessMap.get(_workSpaceFolder);
      if (!process) {
        logger.warn(
          `Typescript server process reference missing for workspace: ${_workSpaceFolder}`,
        );
        return;
      }

      if (!process.IsRunning()) {
        logger.warn(
          `Typescript server process not running for workspace: ${_workSpaceFolder}`,
        );
        return;
      }

      process.DidOpenTextDocument(filePath, text);
    } catch (error) {
      logError(
        error,
        `Failed to send didOpenTextDocument for workspace: ${workspaceFolder} file: ${filePath}`,
      );

      throw error;
    }
  }

  /**
   * @type {import("../../type").ILanguageServerGetWorkspaceFolders}
   */
  GetWorkspaceFolders() {
    return Array.from(this.#workSpaceProcessMap.keys());
  }

  /**
   * @type {import("../../type").ILanguageServerHover}
   */
  async Hover(workSpaceFolder, filePath, position) {
    if (typeof workSpaceFolder !== "string" || workSpaceFolder.trim() === "")
      throw new Error("workSpaceFolder must be a non-empty string");

    if (typeof filePath !== "string" || filePath.trim() === "")
      throw new Error("filePath must be a non-empty string");

    if (typeof position !== "object")
      throw new Error("position must be a valid object");

    try {
      const _workSpaceFolder = path.normalize(path.resolve(workSpaceFolder));

      if (!this.#workSpaceProcessMap.has(_workSpaceFolder)) {
        return Promise.reject(
          new Error(
            `Typescript server not running for workspace: ${_workSpaceFolder}`,
          ),
        );
      }

      const process = this.#workSpaceProcessMap.get(_workSpaceFolder);
      if (!process) {
        this.#workSpaceProcessMap.delete(_workSpaceFolder);
        return Promise.reject(
          new Error(
            `Typescript server process reference missing for workspace: ${_workSpaceFolder}`,
          ),
        );
      }

      if (!process.IsRunning()) {
        return Promise.reject(
          new Error(
            `Typescript server process not running for workspace: ${_workSpaceFolder}`,
          ),
        );
      }

      /**
       * @type {import("typescript").server.protocol.FileLocationRequestArgs}
       */
      let params = {
        file: path.normalize(path.resolve(filePath)),
        line: position.line + 1, // typescript server uses 1-based line numbers
        offset: position.character + 1, // typescript server uses 1-based character numbers
      };

      /**
       * @type {import("typescript").server.protocol.QuickInfoResponse["body"]}
       */
      let responseBody = await process.SendRequest(
        protocol.CommandTypes.Quickinfo,
        params,
      );

      if (!responseBody) {
        throw new Error("No response body from quickinfo request");
      }

      /**
       * @type {import("vscode-languageserver-types").MarkupContent}
       */
      let content = {
        kind: "markdown",
        value: responseBody.displayString, // TODO Fix for UI rendering
      };

      /**
       * @type {import("vscode-languageserver-types").Hover}
       */
      let hoverLspResponse = {
        contents: content,
        range: {
          start: {
            character: responseBody.start.offset - 1,
            line: responseBody.start.line - 1,
          },
          end: {
            character: responseBody.end.offset - 1,
            line: responseBody.end.line - 1,
          },
        },
      };

      return hoverLspResponse;
    } catch (error) {
      logError(
        error,
        `Failed to get hover for workspace: ${workSpaceFolder} file: ${filePath}`,
      );

      throw error;
    }
  }

  /**
   * @type {import("../../type").ILanguageServerIsRunning}
   */
  IsRunning(workSpaceFolder) {
    const _workSpaceFolder = path.normalize(path.resolve(workSpaceFolder));
    const process = this.#workSpaceProcessMap.get(_workSpaceFolder);
    return process ? process.IsRunning() : false;
  }

  /**
   * @type {import("../../type").ILanguageServerStopAll}
   */
  async StopAll() {
    let wsfs = Array.from(this.#workSpaceProcessMap.keys());
    /** @type {import("../../type").ILanguageServerStopAllResult[]} */
    let result = [];

    for (const wsf of wsfs) {
      result.push({
        workSpaceFolder: wsf,
        result: await this.Stop(wsf),
      });
    }

    return result;
  }
}

module.exports = {
  TypeScriptLanguageServer,
};
