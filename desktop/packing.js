/*
 * Contains all code and helpers related to app packing state
 */

const path = require("path");
const { logger } = require("./logger");

let electronApp;
try {
  ({ app: electronApp } = require("electron"));
} catch {
  electronApp = null; // Running outside Electron (e.g. tests, scripts)
}

/**
 * Checks if the application is packaged
 * @returns {boolean}
 */
const isPackaged = () => {
  return electronApp ? electronApp.isPackaged : false;
};

/**
 * Get the path of the bin folder (dev or packaged)
 * @returns {string}
 */
const binPath = () => {
  try {
    return isPackaged()
      ? path.join(process.resourcesPath, "bin")
      : path.join(__dirname, "bin");
  } catch (error) {
    logger.error("Failed to get bin path " + JSON.stringify(error));
    return "";
  }
};

/**
 * Get the path to the TypeScript language server
 * @returns {string}
 */
const getTypescriptServerPath = () => {
  return isPackaged()
    ? path.join(process.resourcesPath, "typescript", "tsserver.js")
    : path.join(__dirname, "node_modules", "typescript", "lib", "tsserver.js");
};

/**
 * Get the path to the Python language server
 * @returns {string}
 */
const getPythonServerPath = () => {
  return isPackaged()
    ? path.join(process.resourcesPath, "pyright", "langserver.index.js")
    : path.join(__dirname, "node_modules", "pyright", "langserver.index.js");
};

module.exports = {
  isPackaged,
  binPath,
  getTypescriptServerPath,
  getPythonServerPath,
};
