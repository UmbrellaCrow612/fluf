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
const readDirImpl = async (event = undefined, directoryPath) => {
  let items = await fsp.readdir(directoryPath, { withFileTypes: true });

  // Map to include metadata
  /**@type {Array<fileNode>} */
  let mappedItems = items.map((item) => ({
    name: item.name,
    path: path.join(directoryPath, item.name),
    isDirectory: item.isDirectory(),
    children: [],
    expanded: false,
    mode: "default",
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

/**
 * @type {isMaximized}
 */
const isMaximizedImpl = async (_event = undefined) => {
  const webContents = _event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  return win.isMaximized();
};

/**
 * @type {restore}
 */
const restoreImpl = (_event = undefined) => {
  const webContents = _event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  win.restore();
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
};
