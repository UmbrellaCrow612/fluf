/**
 * Contains the code for python lsp
 *
 * DOCS: https://microsoft.github.io/pyright/#/
 * LSP DOCS: https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/
 */

const { spawn } = require("child_process");
const { logger } = require("./logger");
const { getPythonServerPath } = require("./packing");
const fs = require("fs");
const nodePath = require("path");

// Find the method you need to send from the LSP docs
// Then use the base type from vscode-languageserver-protocol
// Then for method use the typed methods from your type.js file
// Then find correct param type to send from LSP docs and also vscode protocol type

let seq = 0;
/** Get the next number */
const getSeq = () => seq++;

/**
 * Refrence to the spawned lsp
 * @type {import("child_process").ChildProcessWithoutNullStreams | null}
 */
let spawnRef = null;

/**
 * Refrence to the main window
 * @type {import("electron").BrowserWindow | null}
 */
let mainWindowRef = null;

/**
 * Being the python language server
 * @returns {void} Nothing
 */
function startPythonLanguageServer() {
  const path = getPythonServerPath();
  if (!fs.existsSync(path)) {
    logger.error("Python language server not found " + path);
    return;
  }

  try {
    spawnRef = spawn("node", [path, "--stdio"]);

    spawnRef.stdout.on("data", (chunk) => {
      logger.info(chunk.toString());
    });

    spawnRef.stderr.on("data", (chunk) => {
      logger.error("Python Language server error:");
      logger.error(chunk.toString());
    });

    logger.info("Started python language server at " + path);
  } catch (error) {
    logger.error("Failed to start python server " + JSON.stringify(error));
  }
}

/**
 * Stops the python LSP
 */
function stopPythonLanguageServer() {
  try {
    if (spawnRef) {
      spawnRef.kill();
      logger.info("Stopped python language server");
    }
  } catch (error) {
    logger.error(
      "Failed to stop python language server " + JSON.stringify(error),
    );
  }
}

/**
 * Write a request to the stdin
 * @param {import("vscode-languageserver-protocol").RequestMessage} request
 */
function write(request) {
  if (spawnRef) {
    spawnRef.stdin.write(JSON.stringify(request) + "\n");
  }
}

/**
 * Converts a local file path into an LSP-compliant DocumentUri.
 *
 * A DocumentUri is a string representation of a URI that follows RFC 3986.
 * On Windows, drive letters are uppercased and properly encoded.
 *
 * @param {string} filePath - The relative or absolute path to a file.
 * @returns {string} The LSP-compliant DocumentUri string.
 *
 * @example
 * createUri('C:\\project\\readme.md'); // 'file:///C:/project/readme.md'
 * createUri('./file.txt');             // 'file:///absolute/path/to/file.txt'
 * createUri('/home/user/file.txt');    // 'file:///home/user/file.txt'
 */
function createUri(filePath) {
  if (typeof filePath !== "string") {
    throw new TypeError("filePath must be a string");
  }

  // Resolve relative paths to absolute
  let absolutePath = nodePath.resolve(filePath);

  // On Windows, replace backslashes with forward slashes
  absolutePath = absolutePath.replace(/\\/g, "/");

  // Encode special characters for URI (except ':' in drive letters)
  let prefix = "";
  if (/^[a-zA-Z]:/.test(absolutePath)) {
    // Windows drive letter: C:/path → /C:/path
    prefix = "/";
  }

  const parts = absolutePath.split("/").map(encodeURIComponent);
  const uriPath = prefix + parts.join("/");

  return `file://${uriPath}`;
}

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainEventCallback, import("./type").pythonServerOpen>}
 */
const openImpl = (_, filePath, fileContent) => {
  try {
    /**
     * @type {import("vscode-languageserver-protocol").RequestMessage}
     */
    const object = {
      id: getSeq(),
      /** @type {import("./type").LanguageServerProtocolMethod} */
      method: "textDocument/didOpen",
      /** @type {import("./type").LanguageServerjsonrpc} */
      jsonrpc: "2.0",
      /** @type {import("vscode-languageserver-protocol").DidOpenTextDocumentParams } */
      params: {
        textDocument: {
          /** @type {import("./type").LanguageServerLanguageId} */
          languageId: "python",
          text: fileContent,
          version: 0,
          uri: createUri(filePath),
        },
      },
    };

    write(object);
  } catch (error) {
    logger.error(
      "Failed to open file in python language server " + JSON.stringify(error),
    );
  }
};

// for testing locally in node without running all of it editor
// `node .\python.js`
startPythonLanguageServer();
setTimeout(() => {
  stopPythonLanguageServer();
}, 2000);

/**
 * Register all python lsp related listeners
 * @param {import("electron").IpcMain} ipcMain
 * @param {import("electron").BrowserWindow} mainWindow
 */
const reigsterPythonLanguageServerListeners = (ipcMain, mainWindow) => {
  mainWindowRef = mainWindow;

  ipcMain.on("python:open", openImpl);
};

module.exports = {
  startPythonLanguageServer,
  stopPythonLanguageServer,
  reigsterPythonLanguageServerListeners,
};
