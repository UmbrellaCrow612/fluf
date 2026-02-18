import type {
  Position,
  TextDocumentContentChangeEvent,
} from "vscode-languageserver-protocol";
import { JsonRpcLanguageServer } from "../json-rpc-language-server.js";
import { getPythonServerPath } from "../../packing.js";
import type { ILanguageServer, languageId } from "../../type.js";

/**
 * The python language server implementation using JSON rpc
 * @implements {ILanguageServer}
 */
export class PythonLanguageServer
  extends JsonRpcLanguageServer
  implements ILanguageServer
{
  Start(workSpaceFolder: string) {
    const exePath = getPythonServerPath();
    if (!exePath) {
      throw new Error("No python exe path");
    }

    return this._start("node", [exePath, "--stdio"], workSpaceFolder); // bit diff as cant spawn js file, use node to spawn it, the exe path is a js file
  }

  Stop(wsf: string) {
    return this._stop(wsf);
  }

  IsRunning(wsf: string) {
    return this._isRunning(wsf);
  }

  GetWorkspaceFolders() {
    return this._getWorkSpaceFolders();
  }

  DidOpenTextDocument(
    wsf: string,
    filePath: string,
    langId: languageId,
    version: number,
    text: string,
  ) {
    this._didOpenTextDocument(wsf, filePath, langId, version, text);
  }

  StopAll() {
    return this._stopAll();
  }

  DidChangeTextDocument(
    wsf: string,
    fp: string,
    version: number,
    changes: TextDocumentContentChangeEvent[],
  ) {
    this._didChangeTextDocument(wsf, fp, version, changes);
  }

  DidCloseTextDocument(wsf: string, fp: string) {
    this._didCloseTextDocument(wsf, fp);
  }

  Hover(workSpaceFolder: string, filePath: string, position: Position) {
    return this._hover(workSpaceFolder, filePath, position);
  }

  Completion(workSpaceFolder: string, filePath: string, position: Position) {
    return this._completion(workSpaceFolder, filePath, position);
  }

  Definition(workSpaceFolder: string, filePath: string, position: Position) {
    return this._definition(workSpaceFolder, filePath, position);
  }
}
