/*
 * Contains = path helpers utils
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
import type { TypedIpcMain } from "./typed-ipc.js";

const normImpl: CombinedCallback<IpcMainInvokeEventCallback, normalizePath> = (
  _,
  fp,
) => {
  try {
    if (!fp) return Promise.resolve("");

    return Promise.resolve(path.normalize(fp));
  } catch (error) {
    logger.error("Failed to normalise path ", error);
    return Promise.resolve("");
  }
};

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

const sepImpl: CombinedCallback<IpcMainInvokeEventCallback, pathSep> = () => {
  return Promise.resolve(path.sep);
};

const joinImpl: CombinedCallback<IpcMainInvokeEventCallback, pathJoin> = (
  _,
  ...args
) => {
  return Promise.resolve(path.join(...args));
};

const isAbs: CombinedCallback<IpcMainInvokeEventCallback, pathIsabsolute> = (
  _,
  p,
) => {
  return Promise.resolve(path.isAbsolute(p));
};

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
 * All path event operations
 */
export interface PathEvents {
  "path:normalize": {
    args: [pathLike: string];
    return: string;
  };
  "path:relative": {
    args: [from: string, to: string];
    return: string;
  };
  "path:sep": {
    args: [];
    return: "\\" | "/";
  };
  "path:join": {
    args: [...string[]];
    return: string;
  };
  "path:is:absolute": {
    args: [pathLike: string];
    return: boolean;
  };
  "path:root": {
    args: [];
    return: string;
  };
}

/**
 * Register all path listeners
 */
export const registerPathListeners = (typedIpcMain: TypedIpcMain) => {
  typedIpcMain.handle("path:normalize", normImpl);
  typedIpcMain.handle("path:relative", relImpl);
  typedIpcMain.handle("path:sep", sepImpl);
  typedIpcMain.handle("path:join", joinImpl);
  typedIpcMain.handle("path:is:absolute", isAbs);
  typedIpcMain.handle("path:root", getRootPathImpl);
};
