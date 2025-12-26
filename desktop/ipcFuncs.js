/**
 * File contains all our impl of electron api funcs to be exposed in the electron api to render
 */

const { dialog, BrowserWindow } = require("electron");
const fsp = require("fs/promises");
const fs = require("fs");
const path = require("path");

/**
 * Gets the extension from a filename.
 * @param {string} filename
 * @returns {string|null} The extension without the dot, or null if none.
 */
function getExtension(filename) {
  if (typeof filename !== "string") return null;

  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1 || lastDot === filename.length - 1) return null;

  return filename.slice(lastDot + 1).toLowerCase();
}

/**
 * @type {import("./type").selectFolder}
 */
const selectFolderImpl = async (_event = undefined) => {
  return await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
};

/**
 * @type {import("./type").minimize}
 */
const minimizeImpl = (_event = undefined) => {
  const webContents = _event?.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  win?.minimize();
};

/**
 * @type {import("./type").maximize}
 */
const maximizeImpl = (_event = undefined) => {
  const webContents = _event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  win.maximize();
};

/**
 * @type {close}
 */
const closeImpl = (_event = undefined) => {
  const webContents = _event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  win.close();
};

/**
 * @type {import("./type").isMaximized}
 */
const isMaximizedImpl = async (_event = undefined) => {
  const webContents = _event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  return win.isMaximized();
};

/**
 * @type {import("./type").restore}
 */
const restoreImpl = (_event = undefined) => {
  const webContents = _event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  win.restore();
};

/**
 * @type {import("./type").createDirectory}
 */
const createDirectoryImpl = async (_event = undefined, fp) => {
  try {
    await fsp.mkdir(fp, { recursive: false });
    return true; // folder created
  } catch (err) {
    if (err.code === "EEXIST") {
      return false;
    }
    throw err;
  }
};

/**
 * List of watchers active by key directory path and value the watcher
 * @type {Map<string, import("fs").FSWatcher>}
 */
const watchersStore = new Map();

/** @type {import("./type").watchDirectory} */
const watchDirectoryImpl = async (_event = undefined, dirPath) => {
  if (!fs.existsSync(dirPath)) return false;

  if (watchersStore.has(dirPath)) return true;

  const watcher = fs.watch(
    dirPath,
    { persistent: true },
    (eventType, filename) => {
      if (filename) {
        /** @type {import("./type").directoryChangedData} */
        let dirChangedData = {
          dirPath,
          eventType,
          filename,
        };
        _event?.sender.send("dir:changed", dirChangedData);
      }
    }
  );

  watchersStore.set(dirPath, watcher);

  return true;
};

/** @type {import("./type").unwatchDirectory} */
const unwatchDirectoryImpl = async (_event = undefined, dp) => {
  const watcher = watchersStore.get(dp);
  if (watcher) {
    watcher.close();
    watchersStore.delete(dp);
    return true;
  }
  return false;
};

const cleanUpWatchers = () => {
  Array.from(watchersStore.entries()).forEach(([dirPath, watcher]) => {
    watcher.close();
    watchersStore.delete(dirPath);
  });
};

module.exports = {
  selectFolderImpl,
  minimizeImpl,
  maximizeImpl,
  closeImpl,
  isMaximizedImpl,
  restoreImpl,
  createDirectoryImpl,
  watchDirectoryImpl,
  unwatchDirectoryImpl,
  cleanUpWatchers,
};
