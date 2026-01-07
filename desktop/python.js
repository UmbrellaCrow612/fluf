/**
 * Contains the code for python lsp
 *
 * DOCS: https://microsoft.github.io/pyright/#/
 */

const { spawn } = require("child_process");
const { logger } = require("./logger");
const { getPythonServerPath } = require("./packing");
const fs = require("fs");

/**
 * Refrence to the spawned lsp
 * @type {import("child_process").ChildProcessWithoutNullStreams | null}
 */
let spawnRef = null;

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
      logger.error("PythonLanguage server stderr:", chunk.toString());
    });

    spawnRef.on("close", () => {
      logger.info("Closed");
    });
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
 * Register all python lsp related listeners
 * @param {import("electron").IpcMain} ipcMain
 */
const reigsterPythonLanguageServerListeners = (ipcMain) => {};

module.exports = {
  startPythonLanguageServer,
  stopPythonLanguageServer,
  reigsterPythonLanguageServerListeners,
};
