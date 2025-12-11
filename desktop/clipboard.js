/*
 * Contains all clipboard API code
 */

const path = require("path");
const fs = require("fs/promises");
const { clipboard, nativeImage } = require("electron");

/** @type {import("./type").writeImageToClipboard} */
const writeImageToClipboardImppl = async (_event, filePath) => {
  try {
    const resolvedPath = path.resolve(filePath);

    await fs.access(resolvedPath);

    clipboard.writeImage(nativeImage.createFromPath(resolvedPath), "clipboard");

    return true;
  } catch (err) {
    console.error("Failed to copy file to clipboard:", err);
    return false;
  }
};

/**
 * Registers all listeners and handlers for clipboard API
 * @param {import("electron").IpcMain} ipcMain
 */
const registerClipboardListeners = (ipcMain) => {
  ipcMain.handle("clipboard:write:image", writeImageToClipboardImppl);
};

module.exports = { registerClipboardListeners };
