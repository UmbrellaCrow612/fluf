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

let seq = 0;
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

    spawnRef.on("close", () => {
      logger.info("");
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
 * @type {import("./type").CombinedCallback<import("./type").IpcMainEventCallback, import("./type").pythonServerOpen>}
 */
const openImpl = (_) => {
  try {
  
  } catch (error) {
    logger.error(
      "Failed to open file in python language server " + JSON.stringify(error),
    );
  }
};

// for testing locally in node without running all of it editor
// `node .\python.js`
// startPythonLanguageServer();
// setTimeout(() => {
//   stopPythonLanguageServer();
// }, 2000);

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
