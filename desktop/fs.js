/**
 * Contaisn all file reading and writing methods and expose to main world
 */
const fs = require("fs");

/** @type {readImage} */
const readImgImpl = async (_event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      console.log("File does not exist");
      return undefined;
    }

    const buffer = fs.readFileSync(filePath);

    return buffer.toString("base64");
  } catch (err) {
    console.error("Error reading file:", err);
    return undefined;
  }
};

/**
 * Registers all listeners and handlers for file reading and writing fs
 * @param {import("electron").IpcMain} ipcMain
 */
const registerFsListeners = (ipcMain) => {
  ipcMain.handle("file:img:read", readImgImpl);
};

module.exports = { registerFsListeners };
