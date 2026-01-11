const { logger } = require("./logger");
const { fileURLToPath } = require("node:url");

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").fileUriToAbsolutePath>}
 */
const fileUriToAbsolutePathImpl = async (_, fileUri) => {
  if (!fileUri.startsWith("file://")) {
    logger.error("Invalid file URI");
    return "";
  }

  return fileURLToPath(fileUri);
};

/**
 * Register all URL / URI listeners
 * @param {import("electron").IpcMain} ipcMain
 */
const registerUrlListeners = (ipcMain) => {
  ipcMain.handle("uri:to:path", fileUriToAbsolutePathImpl);
};

module.exports = {
  registerUrlListeners,
};
