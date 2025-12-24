/*
 * Contaisn path helpers utils
 */
const path = require("path");

/**
 * Register all path listeners
 * @param {import("electron").IpcMain} ipcMain
 */
const registerPathListeners = (ipcMain) => {
  ipcMain.handle("path:normalize", (event, /** @type {string}*/ fp) => {
    try {
      if (!fp) return "";

      return path.normalize(path.resolve(fp));
    } catch (error) {
      console.error("Failed to normalise path " + JSON.stringify(error));
      return "";
    }
  });

  ipcMain.handle("path:relative", (event, from, to) => {
    try {
      return path.relative(
        path.normalize(path.resolve(from)),
        path.normalize(path.resolve(to))
      );
    } catch (error) {
      console.error("Failed to get relative path " + JSON.stringify(error));
      return "";
    }
  });
};

module.exports = { registerPathListeners };
