/*
 * Contains all code related to file or folder methods such as those using fs
 */

import path from "path";
import fs from "fs/promises";
import { dialog, BrowserWindow, type OpenDialogReturnValue } from "electron";
import type { Dirent } from "fs";
import type {
  CombinedCallback,
  countItemsInDirectory,
  createDirectory,
  createFile,
  fileNode,
  fsExists,
  fsGetNode,
  fsRemove,
  fsStopWatching,
  fsWatch,
  fuzzyFindDirectorys,
  IpcMainEventCallback,
  IpcMainInvokeEventCallback,
  readDir,
  readFile,
  saveTo,
  selectFile,
  selectFolder,
  writeToFile,
} from "./type.js";
import { logger } from "./logger.js";
import { broadcastToAll } from "./broadcast.js";
import type { TypedIpcMain } from "./typed-ipc.js";

/**
 * Contains a map of specific path and it's abort controller to stop the watcher for it
 * @type {Map<string, AbortController>}
 */
const watcherAbortsMap: Map<string, AbortController> = new Map();

/**
 *
 * @param {string} basePath - The base path used to read the given items for
 * @param {import("node:fs").Dirent<string>[]} dirItems - List of items read
 * @returns {Promise<import("./type").fileNode[]>} List of filenodes
 */
const mapDirItemsToFileNodes = async (
  basePath: string,
  dirItems: Dirent<string>[],
) => {
  /** @type {import("./type").fileNode[]} */
  const filenodes: fileNode[] = [];

  for (const item of dirItems) {
    const itempath = path.resolve(basePath, item.name);
    const stats = await fs.stat(itempath);

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

const saveToImpl: CombinedCallback<IpcMainInvokeEventCallback, saveTo> = async (
  event,
  content,
  options,
) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) {
      logger.error("Failed to get browser window for save to event");
      return false;
    }

    const result = await dialog.showSaveDialog(win, {
      ...options,
    });
    if (result.canceled || result.filePath.trim() == "") return false;

    const fp = path.normalize(path.resolve(result.filePath));
    await fs.writeFile(fp, content, { encoding: "utf-8" });

    return true;
  } catch (error) {
    logger.error(error, "Failed to save file");
    return false;
  }
};

const unwatchImpl: CombinedCallback<IpcMainEventCallback, fsStopWatching> = (
  _,
  pp,
) => {
  try {
    const norm = path.normalize(path.resolve(pp));

    const abort = watcherAbortsMap.get(norm);
    if (!abort) {
      logger.info("Path not being watched");
      return;
    }

    abort.abort("Requested via a direct unwatch command IPC event");
    logger.info("Stoped watching path: ", norm);

    watcherAbortsMap.delete(norm);
  } catch (error) {
    logger.error(error, "Failed to un watch directory");

    throw error;
  }
};

const watchImpl: CombinedCallback<IpcMainEventCallback, fsWatch> = async (
  _,
  fileOrFolderPath,
) => {
  try {
    const norm = path.normalize(path.resolve(fileOrFolderPath));

    if (watcherAbortsMap.has(norm)) {
      logger.info("Path already being watched " + norm);
      return;
    }

    const ac = new AbortController();
    watcherAbortsMap.set(norm, ac);

    const watcher = fs.watch(norm, {
      signal: ac.signal,
      recursive: true,
      encoding: "utf-8",
    });

    logger.info("Watching path: ", norm);

    for await (const event of watcher) {
      broadcastToAll("fs:change", fileOrFolderPath, event);
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") return;

    logger.error(error, "Failed to watch directory");

    throw error;
  }
};

const fuzzyFindDirectorysImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  fuzzyFindDirectorys
> = async (_, pathLike) => {
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

    const suggestions = [];

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

const selectFolderImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  selectFolder
> = () => {
  return dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
};

const createDirImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  createDirectory
> = async (_, dirPath) => {
  try {
    const p = path.normalize(path.resolve(dirPath));

    await fs.mkdir(p, { recursive: true });

    return true;
  } catch (error) {
    logger.error(error, "Failed to create folder");
    return false;
  }
};

const readDirImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  readDir
> = async (_, dirPath) => {
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

const removeImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  fsRemove
> = async (_, fileOrFolderPath) => {
  try {
    const p = path.normalize(path.resolve(fileOrFolderPath));

    await fs.access(p);

    await fs.rm(p, { recursive: true });

    return true;
  } catch (error) {
    logger.error(error, "Failed to remove path");
    return false;
  }
};

const existsImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  fsExists
> = async (_, fileOrFolderPath) => {
  try {
    const p = path.normalize(path.resolve(fileOrFolderPath));

    await fs.access(p);

    return true;
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return false;
    }

    logger.error("Failed to check if a file exists");
    return false;
  }
};

const createFileImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  createFile
> = async (_, filePath) => {
  try {
    if (!filePath) return false;

    const p = path.normalize(path.resolve(filePath));

    await fs.writeFile(p, "", { encoding: "utf-8", flag: "wx" });

    return true;
  } catch (error) {
    logger.error(error, "Failed to create file");
    return false;
  }
};

const writeToFileImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  writeToFile
> = async (_, filePath, fileContent) => {
  try {
    if (!filePath || !fileContent) return false;

    const p = path.normalize(path.resolve(filePath));

    await fs.writeFile(p, fileContent, { encoding: "utf-8" });

    return true;
  } catch (error) {
    logger.error(error, "Failed to write to file");
    return false;
  }
};

const readFileImpl: CombinedCallback<IpcMainInvokeEventCallback, readFile> = (
  _,
  filePath,
) => {
  try {
    return fs.readFile(path.normalize(path.resolve(filePath)), {
      encoding: "utf-8",
    });
  } catch (error) {
    logger.error("Failed to read file ", filePath);

    throw error;
  }
};

const selectFileImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  selectFile
> = (event) => {
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

const getPathAsNodeImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  fsGetNode
> = async (_, fileOrFolderPath) => {
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

const countItemsInDirectoryImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  countItemsInDirectory
> = async (_, dirPath) => {
  try {
    const norm = path.normalize(path.resolve(dirPath));

    const stats = await fs.stat(norm);
    if (!stats.isDirectory()) {
      logger.warn(
        "The provided path is not a directory so we cannot coun the amount of items it has: ",
        norm,
      );
      return 0;
    }

    const items = await fs.readdir(norm);

    return items.length;
  } catch (error) {
    logger.error("Failed to count items in direcotry: ", dirPath, error);

    throw error;
  }
};

/**
 * If any directory are being watch or files stop listening to them
 */
export const cleanUpWatchers = () => {
  const a = Array.from(watcherAbortsMap.values());

  a.forEach((x) => {
    x.abort("Application ended cleaning up");
    logger.info("Cleaned up watcher ", x.signal.reason);
  });
};

/**
 * Contains all file system event operations
 */
export interface FSEvents {
  "file:read": {
    args: [pathLike: string];
    return: string;
  };
  "file:write": {
    args: [pathLike: string, newContent: string];
    return: boolean;
  };
  "file:create": {
    args: [pathLike: string];
    return: boolean;
  };
  "file:save:to": {
    args: [content: string, options: Electron.SaveDialogOptions | undefined];
    return: boolean;
  };
  "file:select": {
    args: [];
    return: OpenDialogReturnValue | null;
  };
  "fs:exists": {
    args: [pathLike: string];
    return: boolean;
  };
  "fs:remove": {
    args: [pathLike: string];
    return: boolean;
  };
  "fs:watch": {
    args: [pathLike: string];
    return: void;
  };
  "fs:change": {
    args: [pathLike: string, event: fs.FileChangeInfo<string>];
    return: void;
  };
  "fs:unwatch": {
    args: [pathLike: string];
    return: void;
  };
  "fs:path:as:node": {
    args: [pathLike: string];
    return: fileNode;
  };
  "dir:read": {
    args: [pathLike: string];
    return: fileNode[];
  };
  "dir:fuzzy:find": {
    args: [searchTerm: string];
    return: string[];
  };
  "dir:create": {
    args: [pathLike: string];
    return: boolean;
  };
  "dir:select": {
    args: [];
    return: OpenDialogReturnValue;
  };
  "dir:items:count": {
    args: [pathLike: string];
    return: number;
  };
}

/**
 * Registers all fs related listeners
 */
export const registerFsListeners = (typedIpcMain: TypedIpcMain) => {
  typedIpcMain.handle("file:read", readFileImpl);
  typedIpcMain.handle("file:write", writeToFileImpl);
  typedIpcMain.handle("file:create", createFileImpl);
  typedIpcMain.handle("fs:exists", existsImpl);
  typedIpcMain.handle("fs:remove", removeImpl);
  typedIpcMain.handle("fs:path:as:node", getPathAsNodeImpl);
  typedIpcMain.handle("dir:read", readDirImpl);
  typedIpcMain.handle("dir:fuzzy:find", fuzzyFindDirectorysImpl);
  typedIpcMain.handle("dir:create", createDirImpl);
  typedIpcMain.handle("dir:select", selectFolderImpl);
  typedIpcMain.handle("dir:items:count", countItemsInDirectoryImpl);
  typedIpcMain.on("fs:watch", watchImpl);
  typedIpcMain.on("fs:unwatch", unwatchImpl);
  typedIpcMain.handle("file:save:to", saveToImpl);
  typedIpcMain.handle("file:select", selectFileImpl);
};
