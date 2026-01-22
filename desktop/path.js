/*
 * Contaisn path helpers utils
 */
const path = require("path");
const { logger } = require("./logger");

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").normalizePath>}
 */
const normImpl = (_, fp) => {
  try {
    if (!fp) return Promise.resolve("");

    return Promise.resolve(path.normalize(fp));
  } catch (error) {
    logger.error("Failed to normalise path " + JSON.stringify(error));
    return Promise.resolve("");
  }
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").relativePath>}
 */
const relImpl = (_, from, to) => {
  try {
    return Promise.resolve(
      path.relative(
        path.normalize(path.resolve(from)),
        path.normalize(path.resolve(to)),
      ),
    );
  } catch (error) {
    logger.error("Failed to get relative path " + JSON.stringify(error));
    return Promise.resolve("");
  }
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").pathSep>}
 */
const sepImpl = async () => {
  return path.sep;
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").pathJoin>}
 */
const joinImpl = async (_, ...args) => {
  return path.join(...args);
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").pathIsabsolute>}
 */
const isAbs = async (_, p) => {
  return path.isAbsolute(p);
};

/**
 * Register all path listeners
 * @param {import("electron").IpcMain} ipcMain
 */
const registerPathListeners = (ipcMain) => {
  ipcMain.handle("path:normalize", normImpl);
  ipcMain.handle("path:relative", relImpl);
  ipcMain.handle("path:sep", sepImpl);
  ipcMain.handle("path:join", joinImpl);
  ipcMain.handle("path:isabsolute", isAbs);
};

module.exports = { registerPathListeners };
