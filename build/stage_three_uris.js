const path = require("path");

const STAGE_THREE_DIST = path.join(__dirname, "../", "dist");
const ELECTRON_DIST_DOWNLOADED = path.join(
  __dirname,
  "node_modules",
  "electron",
  "dist",
);

module.exports = { STAGE_THREE_DIST, ELECTRON_DIST_DOWNLOADED };
