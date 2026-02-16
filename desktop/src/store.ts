/**
 * Used as a way of sotring generic JSON objects in keys and also modifying them, this is used for stoaring things between browser windows.
 */

import path from "path";
import fs from "fs/promises";
import { app, type IpcMain } from "electron";
import type {
  CombinedCallback,
  IpcMainInvokeEventCallback,
  storeClean,
  storeGet,
  storeRemove,
  storeSet,
} from "./type.js";
import { logger } from "./logger.js";
import { broadcastToAll } from "./broadcast.js";

/**
 * Represents the base directory we save store files to
 */
const storeBaseDirectory = path.join(app.getPath("userData"), "store"); // on windows it saves to C:\Users\<you>\AppData\Roaming\<YourApp>\store

const setStoreItemImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  storeSet
> = async (_, key, content) => {
  if (typeof key !== "string" || key.trim().length == 0) {
    throw new TypeError("key must be a non empty string");
  }

  if (typeof content !== "string") {
    throw new TypeError("content must be a string");
  }

  try {
    await fs.mkdir(storeBaseDirectory, { recursive: true });

    const filePath = path.join(storeBaseDirectory, key);

    await fs.writeFile(filePath, content, "utf8");

    logger.info("Set store item at path: ", filePath);

    broadcastToAll(`store:key:${key}:changed`, content);
  } catch (error) {
    logger.error("Failed to set store key: ", key, error);

    throw error;
  }
};

/**
 * @type {CombinedCallback<IpcMainInvokeEventCallback, storeClean>}
 */
const cleanStoreImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  storeClean
> = async () => {
  try {
    await fs.rm(storeBaseDirectory, { recursive: true, force: true });
    await fs.mkdir(storeBaseDirectory, { recursive: true });
  } catch (error) {
    logger.error("Failed to clean store", error);
    throw error;
  }
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").storeGet>}
 */
const getStoreItemImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  storeGet
> = async (_, key) => {
  if (typeof key !== "string" || key.trim().length === 0) {
    throw new TypeError("key must be a non empty string");
  }

  try {
    const filePath = path.join(storeBaseDirectory, key);
    return await fs.readFile(filePath, "utf8");
  } catch (/** @type {any}*/ error: any) {
    if (error.code === "ENOENT") {
      return undefined;
    }

    logger.error("Failed to get content for key:", key, error);
    throw error;
  }
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").storeRemove>}
 */
const removeItemByKeyImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  storeRemove
> = async (_, key) => {
  if (typeof key !== "string" || key.trim().length == 0)
    throw new TypeError("key must be a non empty string");

  try {
    const filePath = path.join(storeBaseDirectory, key);
    await fs.unlink(filePath);
  } catch (error) {
    logger.error("Failed to remove key: ", key, error);

    throw error;
  }
};

/**
 * Register all store listeners
 */
export const registerStoreListeners = (ipcMain: IpcMain) => {
  ipcMain.handle("store:set", setStoreItemImpl);
  ipcMain.handle("store:get", getStoreItemImpl);
  ipcMain.handle("store:clean", cleanStoreImpl);
  ipcMain.handle("store:remove", removeItemByKeyImpl);
};
