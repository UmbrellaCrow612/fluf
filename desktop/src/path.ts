/*
 * Contains = path helpers utils
 */

import path from "path";
import os from "node:os";
import type {
  buildPathSegments,
  CombinedCallback,
  getDefaultProfilePath,
  getRootPath,
  IpcMainInvokeEventCallback,
  normalizePath,
  pathDirname,
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
  return Promise.resolve(path.resolve(path.normalize("/")));
};

const pathDirnameImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  pathDirname
> = async (_, pathLike) => {
  try {
    const norm = path.normalize(pathLike);
    return path.dirname(norm);
  } catch (error) {
    logger.error("Failed to get dirname of path: ", pathLike);

    throw error;
  }
};

const getDefaultProfilePathImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  getDefaultProfilePath
> = () => {
  try {
    const platform = os.platform();

    if (platform === "win32") {
      // Windows: use USERPROFILE, fallback to HOMEDRIVE + HOMEPATH
      const userProfile = process.env["USERPROFILE"];
      if (userProfile) {
        return Promise.resolve(path.normalize(userProfile));
      }

      const homeDrive = process.env["HOMEDRIVE"];
      const homePath = process.env["HOMEPATH"];
      if (homeDrive && homePath) {
        return Promise.resolve(path.normalize(path.join(homeDrive, homePath)));
      }

      // Final fallback
      return Promise.resolve(path.normalize(process.cwd()));
    }

    // Unix-like (macOS, Linux): use HOME environment variable
    const homeDir = os.homedir();
    return Promise.resolve(path.normalize(homeDir));
  } catch (error) {
    logger.error("Failed to get default profile path ", error);
    return Promise.resolve(path.normalize(process.cwd()));
  }
};

const buildPathSegmentsImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  buildPathSegments
> = (_, pathLike) => {
  try {
    const normalized = path.normalize(pathLike);
    const root = path.parse(normalized).root;
    const segments = normalized
      .slice(root.length)
      .split(path.sep)
      .filter(Boolean);

    const resolved: string[] = [];
    let current = root;

    for (const segment of segments) {
      current = path.join(current, segment);
      resolved.push(current);
    }

    return Promise.resolve(resolved);
  } catch (error) {
    logger.error("Failed to build path segments for path", pathLike, error);
    return Promise.resolve([]);
  }
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
  "path:dirname": {
    args: [pathLike: string];
    return: string;
  };
  "path:default:profile": {
    args: [];
    return: string;
  };
  "path:build:segments": {
    args: [pathLike: string];
    return: string[];
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
  typedIpcMain.handle("path:dirname", pathDirnameImpl);
  typedIpcMain.handle("path:default:profile", getDefaultProfilePathImpl);
  typedIpcMain.handle("path:build:segments", buildPathSegmentsImpl);
};
