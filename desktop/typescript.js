/*
    Contains all the code to allow ts typescript language support for the UI editor
*/

const path = require("path");
const { isPackaged } = require("./packing");
const fs = require("fs");
const { spawn } = require("child_process");

/**
 *  @type {import("child_process").ChildProcessWithoutNullStreams}
 */
let childSpawnRef;

/**
 * Get the path to the ts server in both dev and prod
 * @returns {string}
 */
function getPath() {
  return isPackaged()
    ? path.join(__dirname, "typescript", "tsserver.js")
    : path.join(__dirname, "node_modules/typescript/tsserver.js");
}

const startTsServer = () => {
  let p = getPath();
  if (!fs.existsSync(p)) {
    console.log("Failed to stat ts server could not find entry point " + p);
    return;
  }

  childSpawnRef = spawn("node", [p], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  // on stdout emit event
};

const stopTsServer = () => {
  if (childSpawnRef) {
    childSpawnRef.kill();
    console.log("Killed ts server");
  } else {
    console.log("Could not find ts server child processes");
  }
};

const registerTsListners = () => {};

module.exports = { startTsServer, stopTsServer };
