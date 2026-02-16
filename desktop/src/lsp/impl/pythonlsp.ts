import type {
  Position,
  TextDocumentContentChangeEvent,
} from "vscode-languageserver-protocol";
import { JsonRpcLanguageServer } from "../json-rpc-language-server.js";
import { getPythonServerPath } from "../../packing.js";
import type { languageId } from "../../type.js";

/**
 * The python language server implementation using JSON rpc
 * @implements {ILanguageServer}
 */
export class PythonLanguageServer extends JsonRpcLanguageServer {
  /**
   * @type {import("../../type").ILanguageServerStart}
   */
  Start(workSpaceFolder: string) {
    let exePath = getPythonServerPath();
    if (!exePath) {
      throw new Error("No python exe path");
    }

    return this._start("node", [exePath, "--stdio"], workSpaceFolder); // bit diff as cant spawn js file, use node to spawn it, the exe path is a js file
  }

  /**
   * @type {import("../../type").ILanguageServerStop}
   */
  Stop(wsf: string) {
    return this._stop(wsf);
  }

  /**
   * @type {import("../../type").ILanguageServerIsRunning}
   */
  IsRunning(wsf: string) {
    return this._isRunning(wsf);
  }

  /**
   * @type {import("../../type").ILanguageServerGetWorkspaceFolders}
   */
  GetWorkspaceFolders() {
    return this._getWorkSpaceFolders();
  }

  /**
   * @type {ILanguageServerDidOpenTextDocument}
   */
  DidOpenTextDocument(
    wsf: string,
    filePath: string,
    langId: languageId,
    version: number,
    text: string,
  ) {
    return this._didOpenTextDocument(wsf, filePath, langId, version, text);
  }

  /**
   * @type {import("../../type").ILanguageServerStopAll}
   */
  StopAll() {
    return this._stopAll();
  }

  /**
   * @type {ILanguageServerDidChangeTextDocument}
   */
  DidChangeTextDocument(
    wsf: string,
    fp: string,
    version: number,
    changes: TextDocumentContentChangeEvent[],
  ) {
    return this._didChangeTextDocument(wsf, fp, version, changes);
  }

  /**
   * @type {ILanguageServerDidCloseTextDocument}
   */
  DidCloseTextDocument(wsf: string, fp: string) {
    return this._didCloseTextDocument(wsf, fp);
  }

  /**
   * @type {import("../../type").ILanguageServerHover}
   */
  Hover(workSpaceFolder: string, filePath: string, position: Position) {
    return this._hover(workSpaceFolder, filePath, position);
  }

  /**
   * @type {import("../../type").ILanguageServerCompletion}
   */
  Completion(workSpaceFolder: string, filePath: string, position: Position) {
    return this._completion(workSpaceFolder, filePath, position);
  }

  /**
   * @type {import("../../type").ILanguageServerDefinition}
   */
  Definition(workSpaceFolder: string, filePath: string, position: Position) {
    return this._definition(workSpaceFolder, filePath, position);
  }
}
