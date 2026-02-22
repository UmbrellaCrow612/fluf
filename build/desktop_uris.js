/**
 * Contains all the paths and uri's for desktop
 */

const path = require("path");

const DESKTOP_BASE_PATH = path.join(__dirname, "../", "desktop");
const DESKTOP_BIN_PATH = path.join(DESKTOP_BASE_PATH, "bin");
const DESKTOP_BUILD_OUTPUT_PATH = path.join(DESKTOP_BASE_PATH, "dist");
const DESKTOP_PACKAGE_JSON_PATH = path.join(DESKTOP_BASE_PATH, "package.json");

module.exports = {
  DESKTOP_BASE_PATH,
  DESKTOP_BIN_PATH,
  DESKTOP_BUILD_OUTPUT_PATH,
  DESKTOP_PACKAGE_JSON_PATH,
};
