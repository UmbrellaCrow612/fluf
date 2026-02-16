import type { ILanguageServer } from "./../type.js";
import path from "path";
import type { ILanguageServerStopAllResult, languageId } from "../type.js";
import { JsonRpcProcess } from "./json-rpc-process.js";
import { logger } from "../logger.js";
import { createUri } from "./uri.js";
import { broadcastToAll } from "../broadcast.js";
import type { InitializeParams } from "vscode-languageserver-protocol";

/**
 * Base class that implements common JSON-RPC LSP functionality.
 *
 * Convention:
 *
 * - Methods that implement {@link ILanguageServer} interface should be defined in subclasses
 * - Methods should start with `_` indicating it is a shared for all lsp impl can use
 *
 * @see {ILanguageServer} for the interface this class is designed to support
 */
export class JsonRpcLanguageServer {
  /**
   * Required for LSP to work
   * @param {languageId} languageId - The specific language this is for
   */
  constructor(languageId: languageId) {
    if (typeof languageId !== "string")
      throw new TypeError("languageId must be a non empty string");

    this._languageId = languageId;
  }

  /**
   * Holds a map of specific workspace folders normalized and abs and there rpc
   * @type {Map<string, JsonRpcProcess>}
   */
  private _workSpaceRpcMap: Map<string, JsonRpcProcess> = new Map();

  /**
   * Holds the language this LSP is for exmaple `go` or `js` etc
   * @type {languageId | null}
   */
  private _languageId: languageId | null = null;

  /**
   * Start the language server for a given work space folder, spawn's the command for the given workspace if not already.
   * @param {string} command - The command like `gopls` or path to the xe binary to launch it like `c:\dev\bin\gopls.exe`
   * @param {string[]} args - Addtional arguments to pass to the spawned process like `["--stdio"]`
   * @param {string} wsf - The path to the workspace folder to run the lsp for
   * @returns {Promise<boolean>} If it could or could not start it
   */
  async _start(command: string, args: string[], wsf: string): Promise<boolean> {
    if (!command || typeof command !== "string")
      throw new TypeError("command must be a non-empty string");

    if (!args || !Array.isArray(args))
      throw new TypeError("args must be an array");

    if (!wsf || typeof wsf !== "string")
      throw new TypeError("workSpaceFolder must be a non-empty string");

    if (!this._languageId) throw new Error("languageId is null");

    const _workSpaceFolder = path.normalize(path.resolve(wsf));
    const jsonRpcProcess = new JsonRpcProcess(
      command,
      args,
      wsf,
      this._languageId,
    );

    try {
      if (this._workSpaceRpcMap.has(_workSpaceFolder)) {
        logger.warn(
          `Language server already started for command: ${command} at workspace folder: ${_workSpaceFolder}`,
        );
        return true;
      }
      this._workSpaceRpcMap.set(_workSpaceFolder, jsonRpcProcess);

      await jsonRpcProcess.Start();

      let params: InitializeParams = {
        capabilities: {},
        processId: jsonRpcProcess.GetPid() ?? null,
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

      await jsonRpcProcess.SendRequest("initialize", params);
      jsonRpcProcess.Initialized();

      // notify ui lsp ready for given lang and workspace
      broadcastToAll("lsp:on:ready", this._languageId, wsf);

      logger.info(
        `Language server started for command: ${command} at workspace folder: ${wsf}`,
      );
      return true;
    } catch (error) {
      logger.error(
        error,
        `Failed to start language server. command: ${command} workspace folder ${wsf}`,
      );

      jsonRpcProcess.Shutdown();
      this._workSpaceRpcMap.delete(_workSpaceFolder);

      throw error;
    }
  }

  /**
   * Stop the language server at a given workspace folder if one was started
   * @param {string} workSpaceFolder - The workspace folder to stop
   * @returns {Promise<boolean>} If it could or could not
   */
  async _stop(workSpaceFolder: string): Promise<boolean> {
    if (!workSpaceFolder || typeof workSpaceFolder !== "string")
      throw new TypeError("workspace-folder must be a non empty string ");

    try {
      const _workSpaceFolder = path.normalize(path.resolve(workSpaceFolder));
      const rc = this._workSpaceRpcMap.get(_workSpaceFolder);

      if (!rc) {
        return true;
      }

      try {
        await rc.SendRequest("shutdown", {});
      } catch (/** @type {any}*/ error: any) {
        logger.error(error, `Shutdown requested hanged`);
      }

      rc.Exit();
      rc.Shutdown();

      this._workSpaceRpcMap.delete(_workSpaceFolder);

      logger.info(
        `Language server stopped for command: ${rc.GetCommand()} at workspace folder: ${workSpaceFolder}`,
      );
      return true;
    } catch (/** @type {any}*/ error: any) {
      logger.error(
        error,
        `Failed to stop language server for work space folder ${workSpaceFolder}`,
      );

      throw error;
    }
  }

  /**
   * Stop all language servers active for all workspaces
   * @returns {Promise<ILanguageServerStopAllResult[]>} All stop values for all workspaces
   */
  async _stopAll(): Promise<ILanguageServerStopAllResult[]> {
    let wsfs = Array.from(this._workSpaceRpcMap.keys());
    /** @type {ILanguageServerStopAllResult[]} */
    let result: ILanguageServerStopAllResult[] = [];

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
  _isRunning(workSpaceFolder: string): boolean {
    return this._workSpaceRpcMap.has(
      path.normalize(path.resolve(workSpaceFolder)),
    );
  }

  /**
   * Get a list of workspace folders that have a active LSP process running for them
   * @returns {string[]} List of workspace folder paths
   */
  _getWorkSpaceFolders(): string[] {
    return Array.from(this._workSpaceRpcMap.keys());
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
  _didOpenTextDocument(
    workSpaceFolder: string,
    filePath: string,
    languageId: string,
    version: number,
    text: string,
  ): void {
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

      const rc = this._workSpaceRpcMap.get(_workSpaceFolder);
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
  _didChangeTextDocument(
    workSpaceFolder: string,
    filePath: string,
    version: number,
    changes: import("vscode-languageserver-protocol").TextDocumentContentChangeEvent[],
  ): void {
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

      const rc = this._workSpaceRpcMap.get(_workSpaceFolder);
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
  _didCloseTextDocument(workSpaceFolder: string, filePath: string): void {
    if (typeof workSpaceFolder !== "string")
      throw new TypeError("workSpaceFolder must be a non empty string");
    if (typeof filePath !== "string")
      throw new TypeError("filePath must be a non empty string");

    try {
      const _workSpaceFolder = path.normalize(path.resolve(workSpaceFolder));

      const rc = this._workSpaceRpcMap.get(_workSpaceFolder);
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
      logger.error(
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
  _hover(
    workSpaceFolder: string,
    filePath: string,
    position: import("vscode-languageserver-protocol").Position,
  ): Promise<import("vscode-languageserver-protocol").Hover> {
    if (typeof workSpaceFolder !== "string")
      throw new TypeError("workSpaceFolder must be a non empty string");
    if (typeof filePath !== "string")
      throw new TypeError("filePath must be a non empty string");
    if (typeof position !== "object")
      throw new TypeError("position must be a object");

    try {
      const _workSpaceFolder = path.normalize(path.resolve(workSpaceFolder));

      const rc = this._workSpaceRpcMap.get(_workSpaceFolder);
      if (!rc) {
        logger.warn(`No LSP process is running for ${_workSpaceFolder}`);
        return Promise.reject(
          new Error(`No LSP process is running for ${_workSpaceFolder}`),
        );
      }

      if (!rc.IsStarted()) {
        logger.error(
          `LSP process not yet started for command: ${rc.GetCommand()} workspace folder: ${_workSpaceFolder}`,
        );
        return Promise.reject(
          new Error(
            `LSP process not yet started for command: ${rc.GetCommand()} workspace folder: ${_workSpaceFolder}`,
          ),
        );
      }

      /** @type {import("vscode-languageserver-protocol").HoverParams} */
      let params: import("vscode-languageserver-protocol").HoverParams = {
        position,
        textDocument: {
          uri: createUri(filePath),
        },
      };

      return rc.SendRequest("textDocument/hover", params);
    } catch (error) {
      logger.error(
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
  _completion(
    workSpaceFolder: string,
    filePath: string,
    position: import("vscode-languageserver-protocol").Position,
  ): Promise<import("vscode-languageserver-protocol").CompletionList | null> {
    if (typeof workSpaceFolder !== "string")
      throw new TypeError("workSpaceFolder must be a non empty string");
    if (typeof filePath !== "string")
      throw new TypeError("filePath must be a non empty string");
    if (typeof position !== "object")
      throw new TypeError("position must be a object");

    try {
      const _workSpaceFolder = path.normalize(path.resolve(workSpaceFolder));

      const rc = this._workSpaceRpcMap.get(_workSpaceFolder);
      if (!rc) {
        logger.warn(`No LSP process is running for ${_workSpaceFolder}`);
        return Promise.reject(
          new Error(`No LSP process is running for ${_workSpaceFolder}`),
        );
      }

      if (!rc.IsStarted()) {
        logger.error(
          `LSP process not yet started for command: ${rc.GetCommand()} workspace folder: ${_workSpaceFolder}`,
        );
        return Promise.reject(
          new Error(
            `LSP process not yet started for command: ${rc.GetCommand()} workspace folder: ${_workSpaceFolder}`,
          ),
        );
      }

      /** @type {import("vscode-languageserver-protocol").CompletionParams} */
      let params: import("vscode-languageserver-protocol").CompletionParams = {
        position,
        textDocument: {
          uri: createUri(filePath),
        },
      };

      return rc.SendRequest("textDocument/completion", params);
    } catch (error) {
      logger.error(
        error,
        `Failed to get completions for workspace: ${workSpaceFolder} file: ${filePath}, pos: ${position.character} ${position.line}`,
      );

      throw error;
    }
  }

  /**
   * Get definition information
   * @param {string} workSpaceFolder The folder opened in the UI root
   * @param {string} filePath - The specific file to get the definition for
   * @param {import("vscode-languageserver-protocol").Position} position - The position of the symbol to get the definition for
   * @returns {Promise<import("vscode-languageserver-protocol").Definition | null>} - The definition location / locations or null if the position of the symbol is empty whitesapce
   */
  _definition(
    workSpaceFolder: string,
    filePath: string,
    position: import("vscode-languageserver-protocol").Position,
  ): Promise<import("vscode-languageserver-protocol").Definition | null> {
    if (
      typeof workSpaceFolder !== "string" ||
      workSpaceFolder.trim().length === 0
    )
      throw new TypeError("workSpaceFolder must be a non empty string");

    if (typeof filePath !== "string" || filePath.trim().length === 0)
      throw new TypeError("filePath must be a non empty string");

    if (typeof position !== "object")
      throw new TypeError("position must be a object");

    try {
      const _workSpaceFolder = path.normalize(path.resolve(workSpaceFolder));

      const rc = this._workSpaceRpcMap.get(_workSpaceFolder);
      if (!rc) {
        logger.warn(`No LSP process is running for ${_workSpaceFolder}`);
        return Promise.reject(
          new Error(`No LSP process is running for ${_workSpaceFolder}`),
        );
      }

      if (!rc.IsStarted()) {
        logger.error(
          `LSP process not yet started for command: ${rc.GetCommand()} workspace folder: ${_workSpaceFolder}`,
        );
        return Promise.reject(
          new Error(
            `LSP process not yet started for command: ${rc.GetCommand()} workspace folder: ${_workSpaceFolder}`,
          ),
        );
      }

      /**
       * @type {import("vscode-languageserver-protocol").DefinitionParams}
       */
      let params: import("vscode-languageserver-protocol").DefinitionParams = {
        position: position,
        textDocument: {
          uri: createUri(filePath),
        },
      };

      return rc.SendRequest("textDocument/definition", params);
    } catch (error) {
      // TODO: cathc error for empty symbol

      logger.error(
        error,
        `Failed to get completion for workspace folder: ${workSpaceFolder} file: ${filePath} position: ${position.character} ${position.line}`,
      );

      throw error;
    }
  }
}
