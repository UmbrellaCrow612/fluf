const { logger } = require("../logger");
const { GoLanguageServer } = require("./impl/golsp");
const { LanguageServerManager } = require("./manager");
const path = require("path");

/**
 * Refrence to main window to send events without needed a ipc event
 * @type {import("electron").BrowserWindow | null}
 */
let mainWindowRef = null;

var languageServerManager = new LanguageServerManager();
languageServerManager.Register("go", new GoLanguageServer());

/**
 * Helper to stop and clean up all language servers
 */
const stopAllLanguageServers = async () => {
  let lsps = languageServerManager.GetAll();

  for (const lsp of lsps) {
    let result = await lsp.StopAll();
    logger.info(JSON.stringify(result));
  }
};

/**
 * @type {import("../type").CombinedCallback<import("../type").IpcMainInvokeEventCallback, import("../type").ILanguageServerClientStart>}
 */
const startImpl = async (_, wsf, langId) => {
  try {
    let lsp = languageServerManager.Get(langId);
    if (!lsp) {
      logger.warn(`No language server registered for language: ${langId}`);
      return false;
    }

    const _workSpaceFolder = path.normalize(path.resolve(wsf));

    return lsp.Start(_workSpaceFolder);
  } catch (error) {
    logger.error(
      `Failed to start language server for workspace folder: ${wsf} and language: ${langId}`,
    );
    logger.error(JSON.stringify(error));
    return false;
  }
};

/**
 * @type {import("../type").CombinedCallback<import("../type").IpcMainInvokeEventCallback, import("../type").ILanguageServerClientStop>}
 */
const stopLspImpl = async (_, wsf, langId) => {
  try {
    let lsp = languageServerManager.Get(langId);
    if (!lsp) {
      logger.warn(`No language server language: ${langId}`);
      return true;
    }

    const _workSpaceFolder = path.normalize(wsf);
    return lsp.Stop(_workSpaceFolder);
  } catch (error) {
    logger.error(
      `Failed to stop language server for workspace folder: ${wsf} and language: ${langId}`,
    );
    logger.error(JSON.stringify(error));
    return false;
  }
};

/**
 * Register all LSP related IPC channels needed for LSP to work
 * @param {import("electron").IpcMain} ipcMain
 * @param {import("electron").BrowserWindow | null} mainWindow
 */
const registerLanguageServerListener = (ipcMain, mainWindow) => {
  mainWindowRef = mainWindow;

  ipcMain.handle("lsp:start", startImpl);
  ipcMain.handle("lsp:stop", stopLspImpl);
};

module.exports = { registerLanguageServerListener, stopAllLanguageServers };
