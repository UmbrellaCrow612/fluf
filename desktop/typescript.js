/*
    Contains all the code to allow ts typescript language support for the UI editor
*/

const path = require("path");
const { getTsServerPath } = require("./packing");
const fs = require("fs");
const { spawn } = require("child_process");

/**
 *  @type {import("child_process").ChildProcessWithoutNullStreams}
 */
let childSpawnRef;

const startTsServer = () => {
  let p = getTsServerPath();
  if (!fs.existsSync(p)) {
    console.log("Failed to stat ts server could not find entry point " + p);
    return;
  }

  childSpawnRef = spawn("node", [p], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  // on stdout emit event
};

/**
 * Trys to kill TS child processes that was spawned
 */
const stopTsServer = () => {
  if (childSpawnRef) {
    childSpawnRef.kill();
    console.log("Killed ts server");
  } else {
    console.log("Could not find ts server child processes");
  }
};

/**
 * Register all TS main events listeners
 * @param {import("electron").IpcMain} ipcMain
 */
const registerTsListeners = (ipcMain) => {};

module.exports = { startTsServer, stopTsServer, registerTsListeners };
