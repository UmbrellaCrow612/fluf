/*
 * Contains all clipboard API code
 */

const path = require("path");
const fs = require("fs/promises");
const { clipboard, nativeImage } = require("electron");
const { logger } = require("./logger");

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").writeImageToClipboard>}
 */
const copyImpl = async (_, fp) => {
  try {
    const resolvedPath = path.normalize(path.resolve(fp));

    const stats = await fs.stat(resolvedPath);
    if (stats.isDirectory()) {
      logger.error(
        "Cannot copy a directory path to the clipboard: ",
        resolvedPath,
      );
      return false;
    }

    const ext = path.extname(resolvedPath);

    /** @type {Buffer} */
    let buffer = Buffer.alloc(0);

    switch (
      ext // handle any wired img types nbot support by native img
    ) {
      case ".gif":
        // todo add gif support
        break;

      default:
        buffer = await fs.readFile(resolvedPath); // should be normal file path extension such as gif
        break;
    }

    const img = nativeImage.createFromBuffer(buffer);

    if (img.isEmpty()) {
      logger.error("Failed to create native image from path:", resolvedPath);
      return false;
    }

    clipboard.writeImage(img);
    logger.info("Copied image to clipboard:", resolvedPath);

    return true;
  } catch (err) {
    logger.error("Failed to copy file to clipboard:", err);
    return false;
  }
};

/**
 * Registers all listeners and handlers for clipboard API
 * @param {import("electron").IpcMain} ipcMain
 */
const registerClipboardListeners = (ipcMain) => {
  ipcMain.handle("clipboard:write:image", copyImpl);
};

module.exports = { registerClipboardListeners };
