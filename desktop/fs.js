/*
 * Contains all code related to file or folder methods su8ch as those using fs
 */

const path = require("path");
const fs = require("fs/promises");

/**
 * Registers all fs related listeners
 * @param {import("electron").IpcMain} ipcMain
 */
const registerFsListeners = (ipcMain) => {
  ipcMain.handle("file:read", async (_, fp) => {
    try {
      if (!fp) return "";

      let p = path.normalize(path.resolve(fp));

      await fs.access(p);

      return await fs.readFile(p, { encoding: "utf-8" });
    } catch (error) {
      console.error("Failed to read file " + JSON.stringify(error));
      return "";
    }
  });

  ipcMain.handle("file:write", async (_, fp, content) => {
    try {
      if (!fp || !content) return false;

      let p = path.normalize(path.resolve(fp));

      await fs.access(p);

      await fs.writeFile(p, content, { encoding: "utf-8" });

      return true;
    } catch (error) {
      console.error("Failed to write to file " + JSON.stringify(error));
      return false;
    }
  });
};

module.exports = {
  registerFsListeners,
};
