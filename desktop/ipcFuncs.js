/**
 * File contains all our impl of electron api funcs to be exposed in the electron api to render
 */

const { dialog, BrowserWindow } = require("electron");
const fsp = require("fs/promises");
const fs = require("fs");
const path = require("path");

/**
 * @type {import("./type").readFile}
 */
const readFileImpl = async (_event = undefined, filePath) => {
  if (!filePath) {
    console.log("File path not passed");
    return "";
  }

  try {
    let fc = await fsp.readFile(filePath, { encoding: "utf-8" });
    return fc;
  } catch (error) {
    console.log(error);
    return "";
  }
};

/** @type {import("./type").writeToFile} */
const writeToFileImpl = async (event, filePath, content) => {
  try {
    await fsp.access(filePath)

    await fsp.writeFile(filePath, content, 'utf8');

    return true;
  } catch (error) {
    console.error('Error writing to file:', error);
    return false;
  }
};

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
 * @type {import("./type").readDir}
 */
const readDirImpl = async (_event = undefined, directoryPath) => {
  let items = await fsp.readdir(directoryPath, { withFileTypes: true });

  // Map to include metadata
  /**@type {Array<import("./type").fileNode>} */
  let mappedItems = items.map((item) => ({
    name: item.name,
    path: path.join(directoryPath, item.name),
    isDirectory: item.isDirectory(),
    children: [],
    expanded: false,
    parentPath: directoryPath,
    mode: "default",
    extension: getExtension(item.name) ?? "",
  }));

  // Sort: folders first, then files — both alphabetically
  mappedItems.sort((a, b) => {
    // If one is a folder and the other is not
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    // Otherwise, sort alphabetically by name
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });

  return mappedItems;
};

/**
 * @type {import("./type").selectFolder}
 */
const selectFolderImpl = async (_event = undefined) => {
  return await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
};

/**
 * @type {import("./type").exists}
 */
const existsImpl = async (_event = undefined, path) => {
  try {
    return fs.existsSync(path);
  } catch (error) {
    console.log("Error with exists function " + error);
    return false;
  }
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
 * @type {import("./type").normalize}
 */
const normalizeImpl = async (_event = undefined, p) => {
  return path.normalize(p);
};

/**
 * @type {import("./type").createFile}
 */
const createFileImpl = async (_event = undefined, destinationPath) => {
  try {
    await fsp.mkdir(path.dirname(destinationPath), { recursive: true });

    await fsp.writeFile(destinationPath, "");
    return true;
  } catch (error) {
    console.error("Error creating file:", error);
    return false;
  }
};

/**
 * @type {import("./type").fileExists}
 */
const fileExistsImpl = async (_event = undefined, fp) => {
  try {
    const stats = await fsp.stat(fp);
    return stats.isFile();
  } catch (err) {
    if (err.code === "ENOENT") return false;
    throw err;
  }
};

/**
 * @type {import("./type").directoryExists}
 */
const directoryExistsImpl = async (_event = undefined, fp) => {
  try {
    const stats = await fsp.stat(fp);
    return stats.isDirectory();
  } catch (err) {
    if (err.code === "ENOENT") return false;
    throw err;
  }
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
 * @type {import("./type").deleteFile}
 */
const deleteFileImpl = async (_event = undefined, fp) => {
  try {
    const resolvedPath = path.resolve(fp);

    await fsp.unlink(resolvedPath);

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

/**
 * @type {import("./type").deleteDirectory}
 */
const deletDirectoryImpl = async (_event = undefined, dp) => {
  try {
    const resolvedPath = path.resolve(dp);

    await fsp.rm(resolvedPath, { recursive: true, force: false });

    return true;
  } catch (error) {
    console.log(error);
    return false;
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
  writeToFileImpl
};
