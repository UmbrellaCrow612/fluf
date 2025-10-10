/**
 * File contains all our impl of electron api funcs to be exposed in the electron api to render
 */

const { dialog, BrowserWindow } = require("electron");
const fsp = require("fs/promises");
const fs = require("fs");
const path = require("path");

/**
 * @type {readFile}
 */
const readFileImpl = async (event = undefined, filePath) => {
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

/**
 * @type {readDir}
 */
const readDirImpl = async (event = undefined, directoryPath, options = {}) => {
  const { ignoreFolders = [], ignoreFiles = [] } = options;

  /**
   * Recursive helper to read a directory and build its structure
   * @param {string} currentPath
   * @returns {Promise<ReadDirObject | null>}
   */
  async function helper(currentPath) {
    const stat = await fsp.stat(currentPath);
    const name = path.basename(currentPath);

    // If it's a file
    if (stat.isFile()) {
      if (ignoreFiles.includes(name)) return null;
      return {
        isFile: true,
        children: [],
        name,
        path: currentPath,
      };
    }

    // If it's a folder
    if (ignoreFolders.includes(name)) return null;

    const entries = await fsp.readdir(currentPath);
    const children = [];

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry);
      const child = await helper(fullPath);
      if (child) children.push(child);
    }

    return {
      isFile: false,
      children,
      name,
      path: currentPath,
    };
  }

  try {
    return await helper(directoryPath);
  } catch (error) {
    console.error("Error reading directory:", error);
    return {
      isFile: false,
      children: [],
      name: path.basename(directoryPath),
      path: directoryPath,
    };
  }
};

/**
 * @type {selectFolder}
 */
const selectFolderImpl = async (event = undefined) => {
  return await dialog.showOpenDialog({ properties: ["openDirectory"] });
};

/**
 * @type {exists}
 */
const existsImpl = async (_event = undefined, path) => {
  try {
    fs.existsSync(path);
    return true;
  } catch (error) {
    console.log("Error with exists function");
    return false;
  }
};

/**
 * @type {minimize}
 */
const minimizeImpl = (_event = undefined) => {
  const webContents = _event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  win.minimize();
};

/**
 * @type {maximize}
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

module.exports = {
  readFileImpl,
  readDirImpl,
  selectFolderImpl,
  existsImpl,
  minimizeImpl,
  maximizeImpl,
  closeImpl,
};
