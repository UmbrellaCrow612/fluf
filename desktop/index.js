const { app, BrowserWindow, ipcMain, protocol } = require("electron");
const { loadEnv } = require("./env");
const path = require("path");
const { registerFsearchListeners } = require("./fsearch");
const { registerGitListeners } = require("./git");
const { registerClipboardListeners } = require("./clipboard");
const { registerProtocols } = require("./protocol");
const { registerPdfListeners } = require("./pdf");
const { registerImageListeners } = require("./image");
const { cleanUpShells, registerShellListeners } = require("./shell");
const { registerFsListeners, cleanUpWatchers } = require("./fs");
const { registerWindowListener } = require("./window");
const { registerRipgrepListeners } = require("./ripgrep");
const { logger } = require("./logger");
const { registerPathListeners } = require("./path");
const {
  registerLanguageServerListener,
  stopAllLanguageServers,
} = require("./lsp/bridge");
const { registerFileXListeners } = require("./file-x");
const { registerStoreListeners } = require("./store");
const { createCommandServer, stopCommandServer } = require("./command-server/socket");

loadEnv();
registerProtocols();

/**
 * Renders the default route for both dev and in prod - points either to the URL or index.html file which should render the editor itself
 */
const createWindow = () => {
  const window = new BrowserWindow({
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

    window.loadURL(devUIPort);
  } else {
    logger.info("Running application from build index.html");
    window.loadFile("index.html");
  }
};

app.whenReady().then(() => {
  createWindow();
  createCommandServer();

  registerRipgrepListeners(ipcMain);
  registerGitListeners(ipcMain);
  registerFsearchListeners(ipcMain);
  registerClipboardListeners(ipcMain);
  registerPdfListeners(protocol);
  registerImageListeners(protocol);
  registerShellListeners(ipcMain);
  registerFsListeners(ipcMain);
  registerWindowListener(ipcMain);
  registerPathListeners(ipcMain);
  registerFileXListeners(ipcMain);
  registerLanguageServerListener(ipcMain);
  registerStoreListeners(ipcMain);
});

app.on("before-quit", async () => {
  stopCommandServer();

  await stopAllLanguageServers();
  cleanUpWatchers();
  cleanUpShells();

  await logger.flush();
  await logger.shutdown();
});
