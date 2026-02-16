import type {
  Position,
  TextDocumentContentChangeEvent,
} from "vscode-languageserver-protocol";
import { binPath } from "../../packing.js";
import type { ILanguageServer, languageId } from "../../type.js";
import { JsonRpcLanguageServer } from "../json-rpc-language-server.js";
import binmanResolve from "umbr-binman";

/**
 * The go language server implementation using JSON rpc
 * @implements {ILanguageServer}
 */
export class GoLanguageServer
  extends JsonRpcLanguageServer
  implements ILanguageServer
{
  async Start(workSpaceFolder: string) {
    let exePath = await binmanResolve("gopls", ["gopls"], binPath());
    if (!exePath) {
      throw new Error("No gopls exe path");
    }

    return this._start(exePath, ["serve"], workSpaceFolder);
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
    return this._didOpenTextDocument(wsf, filePath, langId, version, text);
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
    return this._didChangeTextDocument(wsf, fp, version, changes);
  }

  DidCloseTextDocument(wsf: string, fp: string) {
    return this._didCloseTextDocument(wsf, fp);
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
