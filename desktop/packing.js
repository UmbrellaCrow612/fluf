const path = require("path");
const fs = require("fs");

/**
 * Checks if the app is packaged
 */
const isPackaged = () => {
  const asarPath = path.join(process.resourcesPath, "app.asar");
  return fs.existsSync(asarPath);
};

module.exports = {
  isPackaged,
};
