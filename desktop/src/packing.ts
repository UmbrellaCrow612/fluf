/*
 * Contains all code and helpers related to app packing state
 */

import path from "path";
import { logger } from "./logger.js";
import { fileURLToPath } from "url";
import { app } from "electron";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Checks if the application is packaged
 * @returns {boolean}
 */
export const isPackaged = (): boolean => {
  return app.isPackaged
};

/**
 * Get the path of the bin folder (dev or packaged)
 * @returns {string}
 */
export const binPath = (): string => {
  try {
    return isPackaged()
      ? path.join(process.resourcesPath, "bin")
      : path.join(__dirname, "../", "bin");
  } catch (error) {
    logger.error("Failed to get bin path " + JSON.stringify(error));
    return "";
  }
};

/**
 * Get the path to the TypeScript language server
 * @returns {string}
 */
export const getTypescriptServerPath = (): string => {
  return isPackaged()
    ? path.join(
        process.resourcesPath,
        "node_modules",
        "typescript",
        "tsserver.js",
      )
    : path.join(
        __dirname,
        "../",
        "node_modules",
        "typescript",
        "lib",
        "tsserver.js",
      );
};

/**
 * Get the path to the Python language server
 * @returns {string}
 */
export const getPythonServerPath = (): string => {
  return isPackaged()
    ? path.join(
        process.resourcesPath,
        "node_modules",
        "pyright",
        "langserver.index.js",
      )
    : path.join(
        __dirname,
        "../",
        "node_modules",
        "pyright",
        "langserver.index.js",
      );
};