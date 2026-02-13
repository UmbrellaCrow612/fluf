/*
 * Contaisn path helpers utils
 */
import path from "path";
import os from "node:os";
import type {
  CombinedCallback,
  getRootPath,
  IpcMainInvokeEventCallback,
  normalizePath,
  pathIsabsolute,
  pathJoin,
  pathSep,
  relativePath,
} from "./type.js";
import { logger } from "./logger.js";
import type { IpcMain } from "electron";

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").normalizePath>}
 */
const normImpl: CombinedCallback<IpcMainInvokeEventCallback, normalizePath> = (
  _,
  fp,
) => {
  try {
    if (!fp) return Promise.resolve("");

    return Promise.resolve(path.normalize(fp));
  } catch (error) {
    logger.error("Failed to normalise path " + JSON.stringify(error));
    return Promise.resolve("");
  }
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").relativePath>}
 */
const relImpl: CombinedCallback<IpcMainInvokeEventCallback, relativePath> = (
  _,
  from,
  to,
) => {
  try {
    return Promise.resolve(
      path.relative(
        path.normalize(path.resolve(from)),
        path.normalize(path.resolve(to)),
      ),
    );
  } catch (error) {
    logger.error("Failed to get relative path " + JSON.stringify(error));
    return Promise.resolve("");
  }
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").pathSep>}
 */
const sepImpl: CombinedCallback<IpcMainInvokeEventCallback, pathSep> = () => {
  return Promise.resolve(path.sep);
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").pathJoin>}
 */
const joinImpl: CombinedCallback<IpcMainInvokeEventCallback, pathJoin> = (
  _,
  ...args
) => {
  return Promise.resolve(path.join(...args));
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").pathIsabsolute>}
 */
const isAbs: CombinedCallback<IpcMainInvokeEventCallback, pathIsabsolute> = (
  _,
  p,
) => {
  return Promise.resolve(path.isAbsolute(p));
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").getRootPath>}
 */
const getRootPathImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  getRootPath
> = () => {
  // Windows logic
  if (os.platform() === "win32") {
    // Get something like "C:\" from current working directory
    const root = path.parse(process.cwd()).root;

    // Ensure it always ends with a backslash (Windows uses one)
    return Promise.resolve(root.endsWith("\\") ? root : root + "\\");
  }

  // Unix-based logic → always "/"
  return Promise.resolve("/");
};

/**
 * Register all path listeners
 * @param {import("electron").IpcMain} ipcMain
 */
export const registerPathListeners = (ipcMain: IpcMain) => {
  ipcMain.handle("path:normalize", normImpl);
  ipcMain.handle("path:relative", relImpl);
  ipcMain.handle("path:sep", sepImpl);
  ipcMain.handle("path:join", joinImpl);
  ipcMain.handle("path:isabsolute", isAbs);
  ipcMain.handle("path:root", getRootPathImpl);
};