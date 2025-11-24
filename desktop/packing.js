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
  return p
};

module.exports = {
  isPackaged,
  binPath
};
