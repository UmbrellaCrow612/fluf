import type {
  Position,
  TextDocumentContentChangeEvent,
} from "vscode-languageserver-protocol";
import type {
  ILanguageServer,
  ILanguageServerStopAllResult,
  languageId,
} from "../../type.js";
import { TypeScriptProcess } from "../typescript-process.js";
import { getTypescriptServerPath } from "../../packing.js";
import path from "node:path";
import { logger } from "../../logger.js";
import { broadcastToAll } from "../../broadcast.js";

import { server } from "typescript";
const { protocol } = server;

/**
 * The typescript language server implementation using following json RPC protocol design
 *
 * @implements {ILanguageServer}
 *
 */
export class TypeScriptLanguageServer implements ILanguageServer {
  /**
   * The specific language id for exmaple `typescript`
   * @type {import("../../type").languageId | null}
   */
  #languageId: languageId | null = null;

  /**
   * Holds a map of workspace and it's process running for it
   * @type {Map<string, import("../typescript-process").TypeScriptProcess>}
   */
  #workSpaceProcessMap: Map<string, TypeScriptProcess> = new Map();

  /**
   * Required for typescript LSP to work
   * @param {import("../../type").languageId} languageId - The specific language id for exmaple `typescript`
   */
  constructor(languageId: languageId) {
    if (typeof languageId !== "string" || languageId.trim() === "")
      throw new Error("languageId must be a non-empty string");

    this.#languageId = languageId;
  }

  async Start(workSpaceFolder: string) {
    if (typeof workSpaceFolder !== "string" || workSpaceFolder.trim() === "")
      throw new Error("workSpaceFolder must be a non-empty string");

    if (typeof this.#languageId !== "string" || this.#languageId.trim() === "")
      throw new Error("languageId must be a non-empty string");

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
      );

      this.#workSpaceProcessMap.set(_workSpaceFolder, process);

      await process.Start(); // we don't need to send a json rpc initialization here because the typescript server doesn't require it

      // notify ui lsp ready for given lang and workspace
      broadcastToAll("lsp:on:ready", this.#languageId, workSpaceFolder);

      logger.info(`Started typescript lsp for workspace: ${workSpaceFolder}`);

      return true;
    } catch (error) {
      logger.error(
        error,
        `Failed to start typescript lsp for workspace: ${workSpaceFolder}`,
      );

      this.#workSpaceProcessMap.delete(
        path.normalize(path.resolve(workSpaceFolder)),
      );

      throw error;
    }
  }

  async Stop(workSpaceFolder: string) {
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
      logger.error(
        error,
        `Failed to stop typescript lsp for workspace: ${_workSpaceFolder}`,
      );

      throw error;
    }
  }

  async Completion(
    workSpaceFolder: string,
    filePath: string,
    position: Position,
  ) {
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
      let params: import("typescript").server.protocol.CompletionsRequestArgs =
        {
          file: path.normalize(path.resolve(filePath)),
          line: position.line + 1, // typescript server uses 1-based line numbers
          offset: position.character + 1, // typescript server uses 1-based character numbers
        };

      /**
       * @type {import("typescript").server.protocol.CompletionInfoResponse["body"]}
       */
      let responseBody: import("typescript").server.protocol.CompletionInfoResponse["body"] =
        await process.SendRequest(protocol.CommandTypes.CompletionInfo, params);

      if (!responseBody) {
        throw new Error("No response body from completionInfo request");
      }

      /**
       * @type {import("vscode-languageserver-types").CompletionList}
       */
      let lspCompletionResponse: import("vscode-languageserver-types").CompletionList =
        {
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
      logger.error(
        error,
        `Failed to get completion for workspace: ${workSpaceFolder} file: ${filePath}`,
      );

      throw error;
    }
  }

  DidChangeTextDocument(
    workSpaceFolder: string,
    filePath: string,
    version: number,
    changes: TextDocumentContentChangeEvent[],
  ) {
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
      process.RequestDiagnostics(filePath); // for typescript we need to manually request errors
    } catch (error) {
      logger.error(
        error,
        `Failed to send didChangeTextDocument for workspace: ${workSpaceFolder} file: ${filePath}`,
      );

      throw error;
    }
  }

  DidCloseTextDocument(workSpaceFolder: string, filePath: string) {
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
      logger.error(
        error,
        `Failed to send didCloseTextDocument for workspace: ${workSpaceFolder} file: ${filePath}`,
      );

      throw error;
    }
  }

  DidOpenTextDocument(
    workspaceFolder: string,
    filePath: string,
    languageId: languageId,
    version: number,
    text: string,
  ) {
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
      process.RequestDiagnostics(filePath); // for typescript we need to manually request errors
    } catch (error) {
      logger.error(
        error,
        `Failed to send didOpenTextDocument for workspace: ${workspaceFolder} file: ${filePath}`,
      );

      throw error;
    }
  }

  GetWorkspaceFolders() {
    return Array.from(this.#workSpaceProcessMap.keys());
  }

  async Hover(workSpaceFolder: string, filePath: string, position: Position) {
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
      let params: import("typescript").server.protocol.FileLocationRequestArgs =
        {
          file: path.normalize(path.resolve(filePath)),
          line: position.line + 1, // typescript server uses 1-based line numbers
          offset: position.character + 1, // typescript server uses 1-based character numbers
        };

      /**
       * @type {import("typescript").server.protocol.QuickInfoResponse["body"]}
       */
      let responseBody: import("typescript").server.protocol.QuickInfoResponse["body"] =
        await process.SendRequest(protocol.CommandTypes.Quickinfo, params);

      if (!responseBody) {
        throw new Error("No response body from quickinfo request");
      }

      /**
       * @type {import("vscode-languageserver-types").MarkupContent}
       */
      let content: import("vscode-languageserver-types").MarkupContent = {
        kind: "markdown",
        value: `${responseBody.displayString} \n ${responseBody.documentation}`, // TODO Fix for UI rendering
      };

      /**
       * @type {import("vscode-languageserver-types").Hover}
       */
      let hoverLspResponse: import("vscode-languageserver-types").Hover = {
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
      // Check if this is the "No content available" error, this is thrown when hovering over empty space or if there is no info
      if (error instanceof Error && error.message === "No content available.") {
        return null;
      }

      logger.error(
        error,
        `Failed to get hover for workspace: ${workSpaceFolder} file: ${filePath}`,
      );

      throw error;
    }
  }

  IsRunning(workSpaceFolder: string) {
    const _workSpaceFolder = path.normalize(path.resolve(workSpaceFolder));
    const process = this.#workSpaceProcessMap.get(_workSpaceFolder);
    return process ? process.IsRunning() : false;
  }

  async StopAll() {
    let wsfs = Array.from(this.#workSpaceProcessMap.keys());
    /** @type {import("../../type").ILanguageServerStopAllResult[]} */
    let result: ILanguageServerStopAllResult[] = [];

    for (const wsf of wsfs) {
      result.push({
        workSpaceFolder: wsf,
        result: await this.Stop(wsf),
      });
    }

    return result;
  }

  async Definition() {
    return null;
  }
}
