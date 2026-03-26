import path from "path";
import type { ILanguageServerStopAllResult, languageId } from "../type.js";
import { JsonRpcProcess } from "./json-rpc-process.js";
import { logger } from "../logger.js";
import { createUri } from "./uri.js";
import { broadcastToAll } from "../broadcast.js";
import type {
  InitializeParams,
  TextDocumentContentChangeEvent,
} from "vscode-languageserver-protocol";
import {
  assertArray,
  assertNonNegativeNumber,
  assertString,
  assertStringArray,
} from "../assert.js";

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
    assertString(languageId);

    this._languageId = languageId;
  }

  /**
   * Holds a map of specific workspace folders normalized and abs and there rpc process running for it
   */
  private _workSpaceRpcMap: Map<string, JsonRpcProcess> = new Map();

  /**
   * Holds the language this LSP is for exmaple `go` or `js` etc
   */
  private _languageId: languageId | null = null;

  /**
   * Get information about the current LSP
   * @returns Object containg all information about the given LSP
   */
  private createInfoBumpObject() {
    return {
      workspaceFolders: [...this._workSpaceRpcMap.keys()],
      languageId: this._languageId,
    };
  }

  /**
   * Normalize a path like string
   * @param pathLike Path
   * @returns Normalized string
   */
  private normalizePath(pathLike: string) {
    return path.resolve(path.normalize(pathLike));
  }

  /**
   * Start the language server for a given work space folder, spawn's the command for the given workspace if not already.
   * @param command - The command like `gopls` or path to the xe binary to launch it like `c:\dev\bin\gopls.exe`
   * @param  args - Addtional arguments to pass to the spawned process like `["--stdio"]`
   * @param wsf - The path to the workspace folder to run the lsp for
   * @returns  If it could or could not start it
   */
  public async _start(
    command: string,
    args: string[],
    wsf: string,
  ): Promise<boolean> {
    assertString(command);
    assertStringArray(args);
    assertString(wsf);

    const languageId = this._languageId as languageId;
    assertString(languageId);

    const workSpaceFolder = this.normalizePath(wsf);
    const jsonRpcProcess = new JsonRpcProcess(command, args, wsf, languageId);

    try {
      if (this._workSpaceRpcMap.has(workSpaceFolder)) {
        logger.warn(
          `Language server already started`,
          this.createInfoBumpObject(),
        );
        return true;
      }
      this._workSpaceRpcMap.set(workSpaceFolder, jsonRpcProcess);

      await jsonRpcProcess.Start();

      const params: InitializeParams = {
        capabilities: {},
        processId: jsonRpcProcess.GetPid() ?? null,
        clientInfo: {
          name: path.basename(workSpaceFolder),
          version: "1",
        },
        workspaceFolders: [
          {
            name: path.basename(workSpaceFolder),
            uri: createUri(workSpaceFolder),
          },
        ],
        rootUri: createUri(workSpaceFolder),
      };

      await jsonRpcProcess.SendRequest("initialize", params);
      jsonRpcProcess.Initialized();

      // notify ui lsp ready for given lang and workspace
      broadcastToAll("lsp:on:ready", languageId, wsf);

      logger.info(`Language server started `, this.createInfoBumpObject());
      return true;
    } catch (error) {
      logger.error("Failed to start lsp ", this.createInfoBumpObject(), error);

      jsonRpcProcess.Shutdown();
      this._workSpaceRpcMap.delete(workSpaceFolder);

      throw error;
    }
  }

  /**
   * Stop the language server at a given workspace folder if one was started
   * @param workSpaceFolder - The workspace folder to stop
   * @returns If it could or could not
   */
  public async _stop(workSpaceFolder: string): Promise<boolean> {
    assertString(workSpaceFolder);

    try {
      const workspaceFolder = this.normalizePath(workSpaceFolder);
      const process = this._workSpaceRpcMap.get(workspaceFolder);

      if (!process) {
        return true;
      }

      try {
        await process.SendRequest("shutdown", {});
      } catch (error) {
        logger.error("Failed to shutdown lsp process ", error);
      }

      try {
        process.Exit();
      } catch (error) {
        logger.error("Failed to exit process ", error);
      }
      process.Shutdown();

      this._workSpaceRpcMap.delete(workspaceFolder);

      logger.info(`Language server stopped `, this.createInfoBumpObject());
      return true;
    } catch (error) {
      logger.error("Failed to stop language server ", error);

      throw error;
    }
  }

  /**
   * Stop all language servers active for all workspaces
   * @returns  All stop values for all workspaces
   */
  public async _stopAll(): Promise<ILanguageServerStopAllResult[]> {
    const wsfs = Array.from(this._workSpaceRpcMap.keys());
    const result: ILanguageServerStopAllResult[] = [];

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
  public _isRunning(workSpaceFolder: string): boolean {
    return this._workSpaceRpcMap.has(this.normalizePath(workSpaceFolder));
  }

  /**
   * Get a list of workspace folders that have a active LSP process running for them
   * @returns List of workspace folder paths
   */
  public _getWorkSpaceFolders(): string[] {
    return Array.from(this._workSpaceRpcMap.keys());
  }

  /**
   * Open a document in the language server process
   * @param  workSpaceFolder - The workspace folder path
   * @param  filePath - The documents file path
   * @param  languageId - The language it for example `go` or `js`
   * @param version - The documents version
   * @param  text - The documents full text content
   * @returns  Write's to the process
   */
  public _didOpenTextDocument(
    workSpaceFolder: string,
    filePath: string,
    languageId: string,
    version: number,
    text: string,
  ): void {
    assertString(workSpaceFolder);
    assertString(filePath);
    assertString(languageId);
    assertNonNegativeNumber(version);
    assertString(text);

    try {
      const workspaceFolder = this.normalizePath(workSpaceFolder);

      const process = this._workSpaceRpcMap.get(workspaceFolder);
      if (!process) {
        logger.warn(
          `No LSP process is running for `,
          this.createInfoBumpObject(),
        );
        return;
      }

      if (!process.IsStarted()) {
        logger.error(
          `LSP process not yet started `,
          this.createInfoBumpObject(),
        );
        return;
      }

      process.DidOpenTextDocument(
        createUri(filePath),
        languageId,
        version,
        text,
      );
    } catch (error) {
      logger.error(
        "Failed to open text document ",
        this.createInfoBumpObject(),
      );

      throw error;
    }
  }

  /**
   * Send document changes
   * @param  workSpaceFolder - The workspace folder path
   * @param filePath - Path to the file that changed
   * @param  version - The documents version after changes
   * @param  changes - List of changes applied to the document
   * @returns  Nothing
   */
  public _didChangeTextDocument(
    workSpaceFolder: string,
    filePath: string,
    version: number,
    changes: TextDocumentContentChangeEvent[],
  ): void {
    assertString(workSpaceFolder);
    assertString(filePath);
    assertNonNegativeNumber(version);
    assertArray(changes);

    try {
      const workspaceFolder = this.normalizePath(workSpaceFolder);

      const process = this._workSpaceRpcMap.get(workspaceFolder);
      if (!process) {
        logger.warn(`No LSP process is running `, this.createInfoBumpObject());
        return;
      }

      if (!process.IsStarted()) {
        logger.error(
          `LSP process not yet started `,
          this.createInfoBumpObject(),
        );
        return;
      }

      process.DidChangeTextDocument(createUri(filePath), version, changes);
    } catch (error) {
      logger.error(
        "Failed to sync changes for documents ",
        this.createInfoBumpObject(),
        error,
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
      const params: import("vscode-languageserver-protocol").HoverParams = {
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
      const params: import("vscode-languageserver-protocol").CompletionParams =
        {
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
      const params: import("vscode-languageserver-protocol").DefinitionParams =
        {
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
