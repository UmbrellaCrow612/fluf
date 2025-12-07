/*
 * Contains all code and helppers todo with app packing state or packing in general
 */

const path = require("path");
const fs = require("fs");

/**
 * Checks if the app is packaged
 */
const isPackaged = () => {
  const asarPath = path.join(process.resourcesPath, "app.asar");
  return fs.existsSync(asarPath);
};

/**
 * Get the path of the bin folder packaged form or dev
 * @returns {string}
 */
const binPath = () => {
  let p = "";
  if (isPackaged()) {
    p = path.join(process.resourcesPath, "bin");
  } else {
    p = path.join(__dirname, "bin");
  }
  return p;
};

/**
 * Get the path to the ts server in both dev and prod
 * @returns {string}
 */
function getTsServerPath() {
  return isPackaged()
    ? path.join(__dirname, "typescript", "tsserver.js")
    : path.join(__dirname, "node_modules", "typescript", "lib", "tsserver.js");
}

module.exports = {
  isPackaged,
  binPath,
  getTsServerPath,
};
