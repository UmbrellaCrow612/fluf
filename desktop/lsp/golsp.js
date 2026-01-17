const binmanResolve = require("umbr-binman");
const { logger } = require("../logger");
const { JsonRpcLanguageServer } = require("./json-rpc-language-server");
const { binPath } = require("../packing");

/**
 * @typedef {import("../type").ILanguageServer} l
 */

/**
 * The go language server
 * @implements {l}
 */
class GoLanguageServer extends JsonRpcLanguageServer {
  /**
   * @type {import("../type").ILanguageServerStart}
   */
  async Start(workSpaceFolder) {
    let exePath = await binmanResolve("gopls", ["gopls"], binPath());
    if (!exePath) {
      throw new Error("No gopls exe path");
    }

    return this._start(exePath, ["serve"], workSpaceFolder);
  }

  /**
   * @type {import("../type").ILanguageServerStop}
   */
  async Stop(wsf) {
    return this._stop(wsf);
  }

  /**
   * @type {import("../type").ILanguageServerIsRunning}
   */
  IsRunning(wsf) {
    return this._isRunning(wsf);
  }

  /**
   * @type {import("../type").ILanguageServerGetWorkspaceFolders}
   */
  GetWorkspaceFolders() {
    return this._getWorkSpaceFolders();
  }

  /**
   * @type {import("../type").ILanguageServerDidOpenTextDocument}
   */
  DidOpenTextDocument(wsf, uri, langId, version, text) {
    return this._didOpenTextDocument(wsf, uri, langId, version, text);
  }
}

// async function test() {
//   let golsp = new GoLanguageServer();

//   console.log(golsp.IsRunning(""));
//   console.log(golsp.IsRunning("C:\\dev\\fluf\\desktop"));

//   await golsp.Start("C:\\dev\\fluf\\desktop");
//   console.log(golsp.IsRunning("C:\\dev\\fluf\\desktop"));

//   await golsp.DidOpenTextDocument(
//     "C:\\dev\\fluf\\desktop",
//     "file:///C:/dev/fluf/desktop/example.go",
//     "go",
//     1,
//     "",
//   );

//   setTimeout(async () => {
//     await golsp.Stop("C:\\dev\\fluf\\desktop");
//     console.log(golsp.IsRunning("C:\\dev\\fluf\\desktop"));
//   }, 4000);
// }

// test();

module.exports = {
  GoLanguageServer,
};
