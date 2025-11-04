/**
 * Contains code to use the folder search binary
 */

const path = require("path");
const fs = require("fs");

/**
 * Gets the path to the fos exe binary
 */
function getPath() {
  let p = path.join(__dirname, "bin", "rg.exe");
  if (!fs.existsSync(p)) {
    return undefined;
  }

  // todo add diff pa based on if it's bundled

  return p;
}

/**
 * Impl for folder search using fos.exe binary
 */
function fosSearchImpl() {}

module.exports = {
  fosSearchImpl,
};
