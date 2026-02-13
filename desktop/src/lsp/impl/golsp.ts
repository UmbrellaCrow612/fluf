const binmanResolve = require("umbr-binman");
const { JsonRpcLanguageServer } = require("../json-rpc-language-server");
const { binPath } = require("../../packing");

/**
 * @typedef {import("../../type").ILanguageServer} ILanguageServer
 */

/**
 * The go language server implementation using JSON rpc
 * @implements {ILanguageServer}
 */
class GoLanguageServer extends JsonRpcLanguageServer {
  /**
   * @type {import("../../type").ILanguageServerStart}
   */
  async Start(workSpaceFolder) {
    let exePath = await binmanResolve("gopls", ["gopls"], binPath());
    if (!exePath) {
      throw new Error("No gopls exe path");
    }

    return this._start(exePath, ["serve"], workSpaceFolder);
  }

  /**
   * @type {import("../../type").ILanguageServerStop}
   */
  Stop(wsf) {
    return this._stop(wsf);
  }

  /**
   * @type {import("../../type").ILanguageServerIsRunning}
   */
  IsRunning(wsf) {
    return this._isRunning(wsf);
  }

  /**
   * @type {import("../../type").ILanguageServerGetWorkspaceFolders}
   */
  GetWorkspaceFolders() {
    return this._getWorkSpaceFolders();
  }

  /**
   * @type {import("../../type").ILanguageServerDidOpenTextDocument}
   */
  DidOpenTextDocument(wsf, filePath, langId, version, text) {
    return this._didOpenTextDocument(wsf, filePath, langId, version, text);
  }

  /**
   * @type {import("../../type").ILanguageServerStopAll}
   */
  StopAll() {
    return this._stopAll();
  }

  /**
   * @type {import("../../type").ILanguageServerDidChangeTextDocument}
   */
  DidChangeTextDocument(wsf, fp, version, changes) {
    return this._didChangeTextDocument(wsf, fp, version, changes);
  }

  /**
   * @type {import("../../type").ILanguageServerDidCloseTextDocument}
   */
  DidCloseTextDocument(wsf, fp) {
    return this._didCloseTextDocument(wsf, fp);
  }

  /**
   * @type {import("../../type").ILanguageServerHover}
   */
  Hover(workSpaceFolder, filePath, position) {
    return this._hover(workSpaceFolder, filePath, position);
  }

  /**
   * @type {import("../../type").ILanguageServerCompletion}
   */
  Completion(workSpaceFolder, filePath, position) {
    return this._completion(workSpaceFolder, filePath, position);
  }

  /**
   * @type {import("../../type").ILanguageServerDefinition}
   */
  Definition(workSpaceFolder, filePath, position) {
    return this._definition(workSpaceFolder, filePath, position);
  }
}

module.exports = {
  GoLanguageServer,
};
