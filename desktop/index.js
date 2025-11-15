const { app, BrowserWindow, ipcMain } = require("electron");
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
} = require("./ipcFuncs");
const { ripGrepImpl } = require("./riggrep");
const { registerFsearchListeners } = require("./fsearch");
const { registerGitListeners, stopWatchingGitRepo } = require("./git");

loadEnv();

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    minWidth: 800,
    height: 600,
    minHeight: 600,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
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
  registerFsearchListeners(ipcMain)

  createWindow();
});

app.on("before-quit", () => {
  cleanUpWatchers();
  stopWatchingGitRepo();
});
