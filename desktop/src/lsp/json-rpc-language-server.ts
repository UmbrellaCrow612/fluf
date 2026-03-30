import path from "path";
import type { ILanguageServerStopAllResult, languageId } from "../type.js";
import { JsonRpcProcess } from "./json-rpc-process.js";
import { logger } from "../logger.js";
import { createUri } from "./uri.js";
import { broadcastToAll } from "../broadcast.js";
import {
  Position,
  type CompletionList,
  type CompletionParams,
  type Definition,
  type DefinitionParams,
  type Hover,
  type HoverParams,
  type InitializeParams,
  type TextDocumentContentChangeEvent,
} from "vscode-languageserver-protocol";
import {
  assertArray,
  assertNonNegativeNumber,
  assertObject,
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
  public _didCloseTextDocument(
    workSpaceFolder: string,
    filePath: string,
  ): void {
    assertString(workSpaceFolder);
    assertString(filePath);

    try {
      const workspaceFolder = this.normalizePath(workSpaceFolder);

      const process = this._workSpaceRpcMap.get(workspaceFolder);
      if (!process) {
        logger.warn(`No LSP process is running `, this.createInfoBumpObject());
        return;
      }

      if (!process.IsStarted()) {
        logger.error(
          `LSP process not yet started`,
          this.createInfoBumpObject(),
        );
        return;
      }

      process.DidCloseTextDocument(createUri(filePath));
    } catch (error) {
      logger.error(
        "Failed to close document ",
        this.createInfoBumpObject(),
        error,
      );

      throw error;
    }
  }

  /**
   * Get hover information
   * @param  workSpaceFolder - The workspace where the file lives
   * @param  filePath - The path to the file to close
   * @param  position - The position at which to get the hover information
   * @returns The hover information
   */
  public _hover(
    workSpaceFolder: string,
    filePath: string,
    position: Position,
  ): Promise<Hover> {
    assertString(workSpaceFolder);
    assertString(filePath);
    assertObject(position);

    try {
      const workspaceFolder = this.normalizePath(workSpaceFolder);

      const process = this._workSpaceRpcMap.get(workspaceFolder);
      if (!process) {
        logger.warn(`No LSP process is running `, this.createInfoBumpObject());
        return Promise.reject(new Error(`No LSP process is running`));
      }

      if (!process.IsStarted()) {
        logger.error(
          `LSP process not yet started `,
          this.createInfoBumpObject(),
        );
        return Promise.reject(new Error(`LSP process not yet started`));
      }

      const params: HoverParams = {
        position,
        textDocument: {
          uri: createUri(filePath),
        },
      };

      return process.SendRequest<Hover>("textDocument/hover", params);
    } catch (error) {
      logger.error(
        "Failed to get hover information ",
        this.createInfoBumpObject(),
      );

      throw error;
    }
  }

  /**
   * Get completion suggestions
   * @param workSpaceFolder - The workspace where the file lives
   * @param  filePath - The path to the file
   * @param  position - The position at which to get completions
   * @returns The completion items or list
   */
  public _completion(
    workSpaceFolder: string,
    filePath: string,
    position: Position,
  ): Promise<CompletionList | null> {
    assertString(workSpaceFolder);
    assertString(filePath);
    assertObject(position);

    try {
      const workspaceFolder = this.normalizePath(workSpaceFolder);

      const process = this._workSpaceRpcMap.get(workspaceFolder);
      if (!process) {
        logger.warn(`No LSP process is running `, this.createInfoBumpObject());
        return Promise.reject(new Error(`No LSP process is running`));
      }

      if (!process.IsStarted()) {
        logger.error(
          `LSP process not yet started `,
          this.createInfoBumpObject(),
        );
        return Promise.reject(new Error(`LSP process not yet started`));
      }

      const params: CompletionParams = {
        position,
        textDocument: {
          uri: createUri(filePath),
        },
      };

      return process.SendRequest("textDocument/completion", params);
    } catch (error) {
      logger.error(
        "Failed to get completion list ",
        this.createInfoBumpObject(),
      );

      throw error;
    }
  }

  /**
   * Get definition information
   * @param  workSpaceFolder The folder opened in the UI root
   * @param  filePath - The specific file to get the definition for
   * @param  position - The position of the symbol to get the definition for
   * @returns The definition location / locations or null if the position of the symbol is empty whitesapce
   */
  public _definition(
    workSpaceFolder: string,
    filePath: string,
    position: Position,
  ): Promise<Definition | null> {
    assertString(workSpaceFolder);
    assertString(filePath);
    assertObject(position);

    try {
      const workspaceFolder = this.normalizePath(workSpaceFolder);

      const process = this._workSpaceRpcMap.get(workspaceFolder);
      if (!process) {
        logger.warn(`No LSP process is running `, this.createInfoBumpObject());
        return Promise.reject(new Error(`No LSP process is running`));
      }

      if (!process.IsStarted()) {
        logger.error(
          `LSP process not yet started `,
          this.createInfoBumpObject(),
        );
        return Promise.reject(new Error(`LSP process not yet started`));
      }

      const params: DefinitionParams = {
        position: position,
        textDocument: {
          uri: createUri(filePath),
        },
      };

      return process.SendRequest("textDocument/definition", params);
    } catch (error) {
      // TODO: cathc error for empty symbol
      logger.error(
        "Failed to get definition ",
        this.createInfoBumpObject(),
        error,
      );

      throw error;
    }
  }
}
