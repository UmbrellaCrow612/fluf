const { app, BrowserWindow, ipcMain, protocol } = require("electron");
const { loadEnv } = require("./env");
const path = require("path");
const { registerFsearchListeners } = require("./fsearch");
const { registerGitListeners } = require("./git");
const { registerClipboardListeners } = require("./clipboard");
const { registerProtocols } = require("./protocol");
const { registerPdfListeners } = require("./pdf");
const { registerImageListeners } = require("./image");
const {
  registerTsListeners,
  stopTypescriptLanguageServer,
} = require("./typescript");
const { cleanUpShells, registerShellListeners } = require("./shell");
const { registerPathListeners } = require("./path");
const { registerFsListeners, cleanUpWatchers } = require("./fs");
const { registerWindowListener } = require("./window");
const { registerRipgrepListeners } = require("./ripgrep");
const {
  reigsterPythonLanguageServerListeners,
  stopPythonLanguageServer,
} = require("./python");
const { logger } = require("./logger");
const { registerUrlListeners } = require("./url");
const {
  registerGoLanguageServerListeners,
  stopGoLanguageServer,
} = require("./gopls");

/**
 * Global ref to main window used for sending events without being coupled to incoming events
 * @type {import("electron").BrowserWindow | null}
 */
let mainWindow = null;

/**
 * Holds state of quiting the app
 */
let isQuitting = false;

loadEnv();
registerProtocols();

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    minWidth: 800,
    height: 600,
    minHeight: 600,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      plugins: true,
    },
  });

  let mode = process.env.MODE;
  if (!mode) {
    logger.error(".env does not contain .env value MODE");
    throw new Error(".env");
  }

  let devUIPort = process.env.DEV_UI_PORT;
  if (!devUIPort) {
    logger.error(".env does not contain .env value DEV_UI_PORT");
    throw new Error(".env");
  }

  if (mode === "dev") {
    // In dev we can just load the running app on the website port it is running on instead of loading it from file system works the same
    logger.info(
      "Running dev mode loading website from " + process.env.DEV_UI_PORT,
    );

    mainWindow.loadURL(devUIPort);
  } else {
    logger.info("Running application from build index.html");
    mainWindow.loadFile("index.html");
  }
};

app.whenReady().then(() => {
  createWindow();

  registerRipgrepListeners(ipcMain);
  registerGitListeners(ipcMain);
  registerFsearchListeners(ipcMain);
  registerClipboardListeners(ipcMain);
  registerPdfListeners(ipcMain, protocol);
  registerImageListeners(ipcMain, protocol);
  registerTsListeners(ipcMain, mainWindow);
  registerShellListeners(ipcMain, mainWindow);
  registerPathListeners(ipcMain);
  registerFsListeners(ipcMain, mainWindow);
  registerWindowListener(ipcMain);
  reigsterPythonLanguageServerListeners(ipcMain, mainWindow);
  registerUrlListeners(ipcMain);
  registerGoLanguageServerListeners(ipcMain, mainWindow);
});

app.on("before-quit", async (event) => {
  if (!isQuitting) {
    event.preventDefault();
    await stopPythonLanguageServer();
    await stopTypescriptLanguageServer();
    await stopGoLanguageServer();

    cleanUpWatchers();
    cleanUpShells();

    isQuitting = true;
    app.quit();
  }
});
