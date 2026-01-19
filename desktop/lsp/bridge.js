const { logger } = require("../logger");
const { GoLanguageServer } = require("./impl/golsp");
const { PythonLanguageServer } = require("./impl/pythonlsp");
const { LanguageServerManager } = require("./manager");

/**
 * Refrence to main window to send events without needed a ipc event
 * @type {import("electron").BrowserWindow | null}
 */
let mainWindowRef = null;

/**
 * Used to fetch the ref to the main window
 * @type {import("../type").getMainWindow}
 */
const getMainWindow = () => {
  return mainWindowRef;
};

var languageServerManager = new LanguageServerManager();
languageServerManager.Register("go", new GoLanguageServer(getMainWindow, "go"));
languageServerManager.Register(
  "python",
  new PythonLanguageServer(getMainWindow, "python"),
);

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
  let lsp = languageServerManager.Get(langId);
  if (!lsp) {
    logger.warn(`No language server registered for language: ${langId}`);
    return false;
  }

  return lsp.Start(wsf);
};

/**
 * @type {import("../type").CombinedCallback<import("../type").IpcMainInvokeEventCallback, import("../type").ILanguageServerClientStop>}
 */
const stopLspImpl = async (_, wsf, langId) => {
  let lsp = languageServerManager.Get(langId);
  if (!lsp) {
    logger.warn(`No language server language: ${langId}`);
    return true;
  }

  return lsp.Stop(wsf);
};

/**
 * @type {import("../type").CombinedCallback<import("../type").IpcMainEventCallback, import("../type").ILanguageServerClientDidChangeTextDocument>}
 */
const docChangedImpl = (
  _,
  workSpaceFolder,
  languageId,
  filePath,
  version,
  changes,
) => {
  let lsp = languageServerManager.Get(languageId);
  if (!lsp) {
    logger.warn(`No language server language: ${languageId}`);
    return;
  }

  lsp.DidChangeTextDocument(workSpaceFolder, filePath, version, changes);
};

/**
 * @type {import("../type").CombinedCallback<import("../type").IpcMainEventCallback, import("../type").ILanguageServerClientDidOpenTextDocument>}
 */
const openDocImpl = (
  _,
  workSpaceFolder,
  languageId,
  filePath,
  version,
  documentText,
) => {
  let lsp = languageServerManager.Get(languageId);
  if (!lsp) {
    logger.warn(`No language server language: ${languageId}`);
    return;
  }

  lsp.DidOpenTextDocument(
    workSpaceFolder,
    filePath,
    languageId,
    version,
    documentText,
  );
};

/**
 * @type {import("../type").CombinedCallback<import("../type").IpcMainInvokeEventCallback, import("../type").ILanguageServerClientIsRunning>}
 */
const isRunningImpl = async (_, workSpaceFolder, languageId) => {
  let lsp = languageServerManager.Get(languageId);
  if (!lsp) {
    logger.warn(`No language server language: ${languageId}`);
    return false;
  }

  return lsp.IsRunning(workSpaceFolder);
};

/**
 * @type {import("../type").CombinedCallback<import("../type").IpcMainEventCallback, import("../type").ILanguageServerClientDidCloseTextDocument>}
 */
const closeDocImpl = (_, workSpaceFolder, languageId, filePath) => {
  let lsp = languageServerManager.Get(languageId);
  if (!lsp) {
    logger.warn(`No language server language: ${languageId}`);
    return;
  }

  lsp.DidCloseTextDocument(workSpaceFolder, filePath);
};

/**
 * @type {import("../type").CombinedCallback<import("../type").IpcMainInvokeEventCallback, import("../type").ILanguageServerClientHover>}
 */
const hoverDocImpl = (_, workSpaceFolder, languageId, filePath, position) => {
  let lsp = languageServerManager.Get(languageId);
  if (!lsp) {
    logger.error(`No language server language: ${languageId}`);
    return Promise.reject(
      `No language server language: ${languageId} cannot provide hover information`,
    );
  }

  return lsp.Hover(workSpaceFolder, filePath, position);
};

/**
 * @type {import("../type").CombinedCallback<import("../type").IpcMainInvokeEventCallback, import("../type").ILanguageServerClientCompletion>}
 */
const completionImpl = (_, workSpaceFolder, languageId, filePath, position) => {
  let lsp = languageServerManager.Get(languageId);
  if (!lsp) {
    logger.error(
      `No language server language: ${languageId} cannot offer completions`,
    );
    return Promise.reject(
      `No language server language: ${languageId} cannot provide completion information`,
    );
  }

  return lsp.Completion(workSpaceFolder, filePath, position);
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
  ipcMain.handle("lsp:is:running", isRunningImpl);

  ipcMain.handle("lsp:document:hover", hoverDocImpl);
  ipcMain.handle("lsp:document:completion", completionImpl);

  ipcMain.on("lsp:document:open", openDocImpl);
  ipcMain.on("lsp:document:change", docChangedImpl);
  ipcMain.on("lsp:document:close", closeDocImpl);
};

module.exports = { registerLanguageServerListener, stopAllLanguageServers };
