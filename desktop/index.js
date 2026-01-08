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
  startLanguageServers,
  stopLanguageServers,
} = require("./language-server");
const { registerTsListeners } = require("./typescript");
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

  if (process.env.MODE === "dev") {
    // In dev we can just load the running app on the website port it is running on instead of loading it from file system works the same
    console.log(
      "Running dev mode loading website from " + process.env.DEV_UI_PORT + "\n",
    );

    let devUIPort = process.env.DEV_UI_PORT;
    if (!devUIPort) {
      throw new Error("No dev UI port DEV_UI_PORT env set or missing");
    }

    mainWindow.loadURL(devUIPort);
  } else {
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

  startLanguageServers();
});

app.on("before-quit", async (event) => {
  if (!isQuitting) {
    event.preventDefault();
    let pythonLsp = await stopPythonLanguageServer();
    logger.info("Python language server " + pythonLsp ? "Stopped" : "Failed");

    cleanUpWatchers();
    stopLanguageServers();
    cleanUpShells();

    isQuitting = true;
    app.quit();
  }
});
