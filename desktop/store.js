/**
 * Used as a way of sotring generic JSON objects in keys and also modifying them, this is used for stoaring things between browser windows.
 */

const { logger } = require("./logger");
const path = require("path");
const fs = require("fs/promises");
const { broadcastToAll } = require("./broadcast");

/**
 * Represents the base directory we save store files to
 */
const storeBaseDirectory = process.resourcesPath
  ? path.join(process.resourcesPath, "store")
  : path.join(__dirname, "dev_store_data");

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").storeSet>}
 */
const setStoreItemImpl = async (_, key, content) => {
  if (typeof key !== "string" || key.trim().length == 0) {
    throw new TypeError("key must be a non empty string");
  }

  if (typeof content !== "string") {
    throw new TypeError("content must be a string");
  }

  try {
    await fs.mkdir(storeBaseDirectory, { recursive: true });

    let filePath = path.join(storeBaseDirectory, key);

    await fs.writeFile(filePath, content, "utf8");

    broadcastToAll(`store:key:${key}:changed`, content);
  } catch (error) {
    logger.error("Failed to set store key: ", key, error);

    throw error;
  }
};

/**
 * Register all store listeners
 * @param {import("electron").IpcMain} ipcMain
 */
const registerStoreListeners = (ipcMain) => {
  ipcMain.handle("store:set", setStoreItemImpl);
};

module.exports = { registerStoreListeners };
