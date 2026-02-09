/*
 * Contains all code related to file or folder methods su8ch as those using fs
 */

const path = require("path");
const fs = require("fs/promises");
const { logger } = require("./logger");
const { dialog, BrowserWindow } = require("electron");
const { broadcastToAll } = require("./broadcast");

/**
 * Contains a map of specific path and it's abort controller to stop the watcher for it
 * @type {Map<string, AbortController>}
 */
const watcherAbortsMap = new Map();

/**
 *
 * @param {string} basePath - The base path used to read the given items for
 * @param {import("node:fs").Dirent<string>[]} dirItems - List of items read
 * @returns {Promise<import("./type").fileNode[]>} List of filenodes
 */
const mapDirItemsToFileNodes = async (basePath, dirItems) => {
  /** @type {import("./type").fileNode[]} */
  const filenodes = [];

  for (const item of dirItems) {
    let itempath = path.resolve(basePath, item.name);
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
      lastModified: stats.mtime.toString(),
      parentName: path.basename(basePath),
    });
  }

  return filenodes;
};

/**
 * Checks whether a filesystem path exists.
 *
 * This returns `false` only when the path is not found (ENOENT).
 * Any other access-related errors are re-thrown so callers can handle them.
 *
 * @param {string} path - The filesystem path to check.
 * @returns {Promise<boolean>} Resolves to `true` if the path exists, or `false` if not found.
 * @throws {Error} Throws any error other than ENOENT (e.g., permission errors).
 */
async function pathExists(path) {
  try {
    await fs.access(path, fs.constants.F_OK);
    return true;
  } catch (/** @type {any}*/ err) {
    if (err && err.code === "ENOENT") {
      return false;
    }
    throw err;
  }
}

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").saveTo>}
 */
const saveToImpl = async (event, content, options) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) {
      logger.error("Failed to get browser window for save to event");
      return false;
    }

    let result = await dialog.showSaveDialog(win, {
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

    abort.abort("Requested via a direct unwatch command IPC event");
    logger.info("Stoped watching path: ", norm)

    watcherAbortsMap.delete(norm)
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

    logger.info("Watching path: ", norm)

    for await (const event of watcher) {
      broadcastToAll("fs:change", fileOrFolderPath, event);
    }
  } catch (/** @type {any}*/ error) {
    if (error.name === "AbortError") return;

    logger.error(error, "Failed to watch directory");

    throw error;
  }
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").fuzzyFindDirectorys>}
 */
const fuzzyFindDirectorysImpl = async (_, pathLike) => {
  try {
    if (!pathLike) pathLike = "."; // default to current dir if empty

    const norm = path.normalize(pathLike);
    const resolved = path.resolve(norm);

    // Determine the directory to search in and the term to match
    let baseDir;
    let searchTerm;

    try {
      const stats = await fs.stat(resolved);
      if (stats.isDirectory()) {
        // If resolved path is an existing directory, search inside it
        baseDir = resolved;
        searchTerm = "";
      } else {
        // If it's a file or non-existent path, search in its parent dir
        baseDir = path.dirname(resolved);
        searchTerm = path.basename(resolved).toLowerCase();
      }
    } catch {
      // If path doesn't exist yet, still try to autocomplete in parent directory
      baseDir = path.dirname(resolved);
      searchTerm = path.basename(resolved).toLowerCase();
    }

    let suggestions = [];

    try {
      const entries = await fs.readdir(baseDir, {
        withFileTypes: true,
        encoding: "utf-8",
        recursive: false,
      });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const entryName = entry.name.toLowerCase();
          if (entryName.startsWith(searchTerm)) {
            suggestions.push(path.join(baseDir, entry.name));
          }
        }
      }
    } catch (fsError) {
      logger.error(
        "Failed to read directory for suggestions: ",
        baseDir,
        searchTerm,
        fsError,
      );
      throw fsError;
    }

    return suggestions;
  } catch (error) {
    logger.error("Failed to fuzzy read path:", pathLike, error);
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

    const res = await fs.readdir(p, {
      encoding: "utf-8",
      withFileTypes: true,
    });

    res.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    const fileNodes = await mapDirItemsToFileNodes(p, res);

    return fileNodes;
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
const selectFileImpl = (event) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) {
      logger.error("Failed to get browser window from event for select file");
      return Promise.resolve(null);
    }

    return dialog.showOpenDialog(win, {
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
    const _path = path.normalize(path.resolve(fileOrFolderPath));

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
      lastModified: stats.mtime.toString(),
      size: stats.size,
      parentName: path.basename(_path),
    };
  } catch (error) {
    logger.error(error, `Failed to get node for path: ${fileOrFolderPath}`);

    throw error;
  }
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").countItemsInDirectory>}
 */
const countItemsInDirectoryImpl = async (_, dirPath) => {
  try {
    const norm = path.normalize(path.resolve(dirPath));

    let stats = await fs.stat(norm);
    if (!stats.isDirectory()) {
      logger.warn(
        "The provided path is not a directory so we cannot coun the amount of items it has: ",
        norm,
      );
      return 0;
    }

    return (await fs.readdir(norm)).length;
  } catch (error) {
    logger.error("Failed to count items in direcotry: ", dirPath, error);

    throw error;
  }
};

/**
 * Registers all fs related listeners
 * @param {import("electron").IpcMain} ipcMain
 */
const registerFsListeners = (ipcMain) => {
  ipcMain.handle("file:read", readFileImpl);
  ipcMain.handle("file:write", writeToFileImpl);
  ipcMain.handle("file:create", createFileImpl);
  ipcMain.handle("fs:exists", existsImpl);
  ipcMain.handle("fs:remove", removeImpl);
  ipcMain.handle("dir:read", readDirImpl);
  ipcMain.handle("dir:fuzzy:find", fuzzyFindDirectorysImpl);
  ipcMain.handle("dir:create", createDirImpl);
  ipcMain.handle("dir:select", selectFolderImpl);
  ipcMain.handle("dir:items:count", countItemsInDirectoryImpl);
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
    x.abort("Application ended cleaning up");
    logger.info("Cleaned up watcher ", x.signal.reason);
  });
};

module.exports = {
  registerFsListeners,
  cleanUpWatchers,
};
