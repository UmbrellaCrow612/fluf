/*
 * Contains all code related to file or folder methods su8ch as those using fs
 */

const path = require("path");
const fs = require("fs/promises");
const { logger } = require("./logger");
const { dialog } = require("electron");

/**
 * Ref to the main window
 * @type {import("electron").BrowserWindow | null}
 */
let mainWindowRef = null;

/**
 * Contains a map of specific path and it's abort controller to stop the watcher for it
 * @type {Map<string, AbortController>}
 */
const watcherAbortsMap = new Map();

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").saveTo>}
 */
const saveToImpl = async (_, content, options) => {
  try {
    if (!mainWindowRef) return false;

    let result = await dialog.showSaveDialog(mainWindowRef, {
      ...options,
    });
    if (result.canceled || result.filePath.trim() == "") return false;

    let fp = path.normalize(path.resolve(result.filePath));
    await fs.writeFile(fp, content, { encoding: "utf-8" });

    return true;
  } catch (error) {
    logger.error(error, "Failed to save file");
    return false;
  }
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainEventCallback, import("./type").fsStopWatching>}
 */
const unwatchImpl = (_, pp) => {
  try {
    let norm = path.normalize(path.resolve(pp));

    let abort = watcherAbortsMap.get(norm);
    if (!abort) {
      logger.info("Path not being watched");
      return;
    }

    abort.abort();
  } catch (error) {
    logger.error(error, "Failed to un watch directory");

    throw error;
  }
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainEventCallback, import("./type").fsWatch>}
 */
const watchImpl = async (_, fileOrFolderPath) => {
  try {
    let norm = path.normalize(path.resolve(fileOrFolderPath));

    if (watcherAbortsMap.has(norm)) {
      logger.info("Path already being watched " + norm);
      return;
    }

    const ac = new AbortController();
    watcherAbortsMap.set(norm, ac);

    let watcher = fs.watch(norm, {
      signal: ac.signal,
      recursive: true,
      encoding: "utf-8",
    });

    for await (const event of watcher) {
      if (mainWindowRef) {
        mainWindowRef.webContents.send("fs:change", fileOrFolderPath, event);
      }
    }
  } catch (/** @type {any}*/ error) {
    if (error.name === "AbortError") return;

    logger.error(error, "Failed to watch directory");

    throw error;
  }
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").selectFolder>}
 */
const selectFolderImpl = async () => {
  return await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").createDirectory>}
 */
const createDirImpl = async (_, dirPath) => {
  try {
    let p = path.normalize(path.resolve(dirPath));

    await fs.mkdir(p, { recursive: true });

    return true;
  } catch (error) {
    logger.error(error, "Failed to create folder");
    return false;
  }
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").readDir>}
 */
const readDirImpl = async (_, dirPath) => {
  try {
    const p = path.normalize(path.resolve(dirPath));

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
    const filenodes = [];

    for (const item of res) {
      let itempath = path.resolve(p, item.name);
      let stats = await fs.stat(itempath);

      filenodes.push({
        name: item.name,
        path: itempath,
        parentPath: item.parentPath,
        isDirectory: item.isDirectory(),
        children: [],
        expanded: false,
        mode: "default",
        extension: item.isDirectory() ? "" : path.extname(item.name),
        size: stats.size,
        lastModified: JSON.stringify(stats.mtime)
      });
    }

    return filenodes;
  } catch (error) {
    logger.error(error, "Failed to read directory");
    return [];
  }
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").fsRemove>}
 */
const removeImpl = async (_, fileOrFolderPath) => {
  try {
    let p = path.normalize(path.resolve(fileOrFolderPath));

    await fs.access(p);

    await fs.rm(p, { recursive: true });

    return true;
  } catch (error) {
    logger.error(error, "Failed to remove path");
    return false;
  }
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").fsExists>}
 */
const existsImpl = async (_, fileOrFolderPath) => {
  try {
    let p = path.normalize(path.resolve(fileOrFolderPath));

    await fs.access(p);

    return true;
  } catch (/** @type {any}*/ error) {
    if (error?.code === "ENOENT") return false; // just didn't exit not true error

    logger.error("Failed to check if a file exists");
    return false;
  }
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").createFile>}
 */
const createFileImpl = async (_, filePath) => {
  try {
    if (!filePath) return false;

    let p = path.normalize(path.resolve(filePath));

    await fs.writeFile(p, "", { encoding: "utf-8", flag: "wx" });

    return true;
  } catch (error) {
    logger.error(error, "Failed to create file");
    return false;
  }
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").writeToFile>}
 */
const writeToFileImpl = async (_, filePath, fileContent) => {
  try {
    if (!filePath || !fileContent) return false;

    let p = path.normalize(path.resolve(filePath));

    await fs.access(p);

    await fs.writeFile(p, fileContent, { encoding: "utf-8" });

    return true;
  } catch (error) {
    logger.error(error, "Failed to write to file");
    return false;
  }
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").readFile>}
 */
const readFileImpl = async (_, filePath) => {
  try {
    if (!filePath) return "";

    let p = path.normalize(path.resolve(filePath));

    await fs.access(p);

    return await fs.readFile(p, { encoding: "utf-8" });
  } catch (error) {
    logger.error("Failed to read file");

    throw error;
  }
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").selectFile>}
 */
const selectFileImpl = () => {
  try {
    if (!mainWindowRef) throw new Error("Main window ref null");

    return dialog.showOpenDialog(mainWindowRef, {
      properties: ["openFile"],
    });
  } catch (error) {
    logger.error("Failed to select file");

    throw error;
  }
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").fsGetNode>}
 */
const getPathAsNodeImpl = async (_, fileOrFolderPath) => {
  try {
    const _path = path.normalize(fileOrFolderPath);

    await fs.access(_path);

    const stats = await fs.stat(_path);
    const isDirectory = stats.isDirectory();

    const name = path.basename(_path);

    const parentPath = path.dirname(_path);

    const extension = isDirectory ? "" : path.extname(name);

    return {
      name,
      path: _path,
      parentPath,
      isDirectory,
      children: [],
      expanded: false,
      mode: "default",
      extension,
      lastModified: JSON.stringify(stats.mtime),
      size: stats.size
    };
  } catch (error) {
    logger.error(error, `Failed to get node for path: ${fileOrFolderPath}`);

    throw error;
  }
};

/**
 * Registers all fs related listeners
 * @param {import("electron").IpcMain} ipcMain
 * @param {import("electron").BrowserWindow | null} mainWindow
 */
const registerFsListeners = (ipcMain, mainWindow) => {
  mainWindowRef = mainWindow;

  ipcMain.handle("file:read", readFileImpl);
  ipcMain.handle("file:write", writeToFileImpl);
  ipcMain.handle("file:create", createFileImpl);
  ipcMain.handle("fs:exists", existsImpl);
  ipcMain.handle("fs:remove", removeImpl);
  ipcMain.handle("dir:read", readDirImpl);
  ipcMain.handle("dir:create", createDirImpl);
  ipcMain.handle("dir:select", selectFolderImpl);
  ipcMain.on("fs:watch", watchImpl);
  ipcMain.on("fs:unwatch", unwatchImpl);
  ipcMain.handle("file:save:to", saveToImpl);
  ipcMain.handle("file:select", selectFileImpl);
  ipcMain.handle("path:node", getPathAsNodeImpl);
};

/**
 * If any directory are being watch or files stop listening to them
 */
const cleanUpWatchers = () => {
  let a = Array.from(watcherAbortsMap.values());

  a.forEach((x) => {
    x.abort();
  });
};

module.exports = {
  registerFsListeners,
  cleanUpWatchers,
};
