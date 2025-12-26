/*
 * Contains all code related to file or folder methods su8ch as those using fs
 */

const path = require("path");
const fs = require("fs/promises");
const { logger } = require("./logger");
const { dialog } = require("electron");

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
      logger.error("Failed to read file " + JSON.stringify(error));
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
      logger.error("Failed to write to file " + JSON.stringify(error));
      return false;
    }
  });

  ipcMain.handle("file:create", async (_, fp) => {
    try {
      if (!fp) return false;

      let p = path.normalize(path.resolve(fp));

      await fs.writeFile(p, "", { encoding: "utf-8", flag: "wx" });

      return true;
    } catch (error) {
      logger.error("Failed to create file " + JSON.stringify(error));
      return false;
    }
  });

  ipcMain.handle("fs:exists", async (_, fp) => {
    try {
      let p = path.normalize(path.resolve(fp));

      await fs.access(p);

      return true;
    } catch (error) {
      logger.error("Failed to check if a file exists" + JSON.stringify(error));
      return false;
    }
  });

  ipcMain.handle("fs:remove", async (_, fp) => {
    try {
      let p = path.normalize(path.resolve(fp));

      await fs.access(p);

      await fs.rm(p, { recursive: true });

      return true;
    } catch (error) {
      logger.error("Failed to remove path " + JSON.stringify(error));
      return false;
    }
  });

  ipcMain.handle("dir:read", async (_, dp) => {
    try {
      const p = path.normalize(path.resolve(dp));

      await fs.access(p);

      const res = await fs.readdir(p, {
        encoding: "utf-8",
        withFileTypes: true,
      });

      res.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });

      /** @type {import("./type").fileNode[]} */
      const filenodes = res.map((item) => ({
        name: item.name,
        path: path.resolve(p, item.name),
        parentPath: p,
        isDirectory: item.isDirectory(),
        children: [],
        expanded: false,
        mode: "default",
        extension: item.isDirectory() ? "" : path.extname(item.name),
      }));

      return filenodes;
    } catch (error) {
      logger.error("Failed to read directory", JSON.stringify(error));
      return [];
    }
  });

  ipcMain.handle("dir:create", async (_, dp) => {
    try {
      let p = path.normalize(path.resolve(dp));

      await fs.mkdir(p, { recursive: true });

      return true;
    } catch (error) {
      logger.error("Failed to create folder " + JSON.stringify(error));
      return false;
    }
  });

  ipcMain.handle("dir:select", async () => {
    return await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
  });
};

module.exports = {
  registerFsListeners,
};
