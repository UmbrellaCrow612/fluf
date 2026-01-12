/**
 * Contains all the code go go LSP to work
 *
 * DOCS: https://github.com/golang/tools/tree/master/gopls
 * FORK: https://github.com/UmbrellaCrow612/go-tools Where we build and download the binarys
 */

const { logger } = require("./logger");
const { getGoServerPath } = require("./packing");
const fs = require("fs/promises")
const path = require("path")

/**
 * Refrence to the main window
 * @type {import("electron").BrowserWindow | null}
 */
let mainWindowRef = null;

/**
 * @type {string | null}
 */
let selectedWorkSpaceFolder = null;


/**
 * Holds refrence to the child processes spawned for gopls
 */
let spawnRef = null;

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").goServerStart>}
 */
const startGoPlsImpl = async (_, workSpaceFolder) => {
  try {
    const _workSpaceFolder = path.normalize(path.resolve(workSpaceFolder))
    await fs.access(_workSpaceFolder)

    let exePath = getGoServerPath()
    await fs.access(exePath)




    return true;
  } catch (error) {
    logger.error("Failed to start go language server " + JSON.stringify(error));
    return false;
  }
};

/**
 * Register all gopls listeners
 * @param {import("electron").IpcMain} ipcMain
 * @param {import("electron").BrowserWindow | null} mainWindow
 */
const registerGoPlsListeners = (ipcMain, mainWindow) => {
  mainWindowRef = mainWindow;

  ipcMain.handle("go:start", startGoPlsImpl);
};

module.exports = { registerGoPlsListeners };
