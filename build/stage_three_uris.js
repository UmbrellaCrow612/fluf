const path = require("path");

const STAGE_THREE_DIST = path.join(__dirname, "../", "stage_three");
const ELECTRON_DIST_DOWNLOADED = path.join(
  __dirname,
  "node_modules",
  "electron",
  "dist",
);
const STAGE_THREE_DIST_RESOURCE = path.join(STAGE_THREE_DIST, "resources")

module.exports = { STAGE_THREE_DIST, ELECTRON_DIST_DOWNLOADED, STAGE_THREE_DIST_RESOURCE };
