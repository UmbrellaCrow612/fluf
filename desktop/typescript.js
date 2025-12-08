/*
    Contains all the code to allow ts typescript language support for the UI editor
*/

const { getTsServerPath } = require("./packing");
const fs = require("fs");
const { spawn } = require("child_process");

/**
 *  @type {import("child_process").ChildProcessWithoutNullStreams | null}
 */
let childSpawnRef = null;

let stdoutBuffer = "";

/**
 * Parse the stdout from ts server
 * @param {string} buffer
 * @returns {Object}
 */
const parseStdout = (buffer) => {
  return {};
};

const startTsServer = () => {
  const path = getTsServerPath();
  if (!fs.existsSync(path)) {
    console.error("TS server not found at:", path);
    return;
  }

  childSpawnRef = spawn("node", [path]);

  childSpawnRef.stdout.on("data", (data) => {
    stdoutBuffer += data.toString();
  });

  childSpawnRef.stderr.on("data", (data) => {
    console.error("TS Server stderr:", data.toString());
  });

  childSpawnRef.on("close", (code) => {
    console.log("TS Server exited with code", code);
  });

  console.log("TS Server started at", path);
};

/**
 * Trys to kill TS child processes that was spawned
 */
const stopTsServer = () => {
  if (childSpawnRef) {
    childSpawnRef.kill();
    console.log("Killed TS server");
    childSpawnRef = null;
  } else {
    console.log("No TS server process to kill");
  }
};

/**
 * Register all TS main events listeners
 * @param {import("electron").IpcMain} ipcMain
 */
const registerTsListeners = (ipcMain) => {
  ipcMain.on("tsserver-send", (event, message) => {
    if (childSpawnRef) {
      childSpawnRef.stdin.write(JSON.stringify(message) + "\n");
      let r = parseStdout(stdoutBuffer);
      if (r) {
        event.sender.send("tsserver-respponse", r);
      }
    }
  });

  // on data out pparse stdout then send event to tsserver-response with parsed stdout of TS server
};

module.exports = { startTsServer, stopTsServer, registerTsListeners };
