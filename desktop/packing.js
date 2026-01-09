/*
 * Contains all code and helppers todo with app packing state or packing in general
 */

const path = require("path");
const fs = require("fs/promises");
const { logger } = require("./logger");

/**
 * Checks if the application is packaged i.e in production or development
 * @returns {Promise<boolean>}
 */
const isPackaged = async () => {
  try {
    if (!process.resourcesPath) return false; // Node.js fallback

    const asarPath = path.join(process.resourcesPath, "app.asar");
    await fs.access(asarPath);

    return true;
  } catch (/** @type {any}*/ error) {
    if (error.code === "ENOENT") return false;

    logger.error(
      "Failed top check if application was packed " + JSON.stringify(error),
    );
    return false;
  }
};

/**
 * Get the path of the bin folder packaged form or dev
 * @returns {Promise<string>}
 */
const binPath = async () => {
  let p = "";
  try {
    let packaged = await isPackaged();
    if (packaged) {
      p = path.join(process.resourcesPath, "bin");
    } else {
      p = path.join(__dirname, "bin");
    }
  } catch (error) {
    logger.error("Failed to get bin path " + JSON.stringify(error));
    return p;
  }

  return p;
};

/**
 * Get the path to the ts server in both dev and prod
 * @returns {Promise<string>} Path to the lang server
 */
async function getTypescriptServerPath() {
  let ispack = await isPackaged();
  return ispack
    ? path.join(__dirname, "typescript", "tsserver.js")
    : path.join(__dirname, "node_modules", "typescript", "lib", "tsserver.js");
}

/**
 * Get the path to the python lsp
 * @returns {Promise<string>} The path to the language server
 */
async function getPythonServerPath() {
  let ispack = await isPackaged();

  return ispack
    ? path.join(__dirname, "pyright", "langserver.index.js")
    : path.join(__dirname, "node_modules", "pyright", "langserver.index.js");
}

module.exports = {
  isPackaged,
  binPath,
  getTypescriptServerPath,
  getPythonServerPath,
};
