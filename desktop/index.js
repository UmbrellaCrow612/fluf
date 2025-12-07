const { app, BrowserWindow, ipcMain, protocol } = require("electron");
const { loadEnv } = require("./env");
const path = require("path");
const {
  readFileImpl,
  readDirImpl,
  selectFolderImpl,
  existsImpl,
  minimizeImpl,
  maximizeImpl,
  closeImpl,
  isMaximizedImpl,
  restoreImpl,
  normalizeImpl,
  createFileImpl,
  fileExistsImpl,
  directoryExistsImpl,
  createDirectoryImpl,
  deleteFileImpl,
  deletDirectoryImpl,
  watchDirectoryImpl,
  unwatchDirectoryImpl,
  cleanUpWatchers,
  writeToFileImpl,
} = require("./ipcFuncs");
const { ripGrepImpl } = require("./ripgrep");
const { registerFsearchListeners } = require("./fsearch");
const { registerGitListeners, stopWatchingGitRepo } = require("./git");
const { registerClipboardListeners } = require("./clipboard");
const { registerProtocols } = require("./protocol");
const { registerPdfListeners } = require("./pdf");
const { registerImageListeners } = require("./image");
const { startLanguageServers, stopLanguageServers } = require("./language-server");

loadEnv();
registerProtocols();

const createWindow = () => {
  const win = new BrowserWindow({
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
    // In dev we can just load the running react app on the website port it is running on instead of loading it from file system works the same
    console.log(
      "Running dev mode loading website from " + process.env.DEV_UI_PORT + "\n"
    );

    // @ts-ignore
    win.loadURL(process.env.DEV_UI_PORT);
  } else {
    win.loadFile("index.html");
    // todo remove dev tools
  }
};

app.whenReady().then(() => {
  ipcMain.handle("file:read", readFileImpl);
  ipcMain.handle("file:create", createFileImpl);
  ipcMain.handle("file:exists", fileExistsImpl);
  ipcMain.handle("file:delete", deleteFileImpl);
  ipcMain.handle("file:write", writeToFileImpl);

  ipcMain.handle("dir:read", readDirImpl);
  ipcMain.handle("dir:select", selectFolderImpl);
  ipcMain.handle("dir:exists", directoryExistsImpl);
  ipcMain.handle("dir:create", createDirectoryImpl);
  ipcMain.handle("dir:delete", deletDirectoryImpl);

  ipcMain.handle("exists", existsImpl);

  ipcMain.handle("path:normalize", normalizeImpl);

  ipcMain.handle("window:isMaximized", isMaximizedImpl);

  ipcMain.handle("dir:watch", watchDirectoryImpl);
  ipcMain.handle("dir:unwatch", unwatchDirectoryImpl);

  ipcMain.on("window:minimize", minimizeImpl);
  ipcMain.on("window:maximize", maximizeImpl);
  ipcMain.on("window:close", closeImpl);
  ipcMain.on("window:restore", restoreImpl);

  ipcMain.handle("ripgrep:search", ripGrepImpl);

  registerGitListeners(ipcMain);
  registerFsearchListeners(ipcMain);
  registerClipboardListeners(ipcMain);
  registerPdfListeners(ipcMain, protocol);
  registerImageListeners(ipcMain, protocol);

  startLanguageServers();

  createWindow();
});

app.on("before-quit", () => {
  cleanUpWatchers();
  stopWatchingGitRepo();
  stopLanguageServers();
});
