/*
    Contains all the code to allow ts typescript language support for the UI editor
*/

const path = require("path");
const { getTsServerPath } = require("./packing");
const fs = require("fs");
const { spawn } = require("child_process");

/**
 *  @type {import("child_process").ChildProcessWithoutNullStreams | null}
 */
let childSpawnRef = null;

const startTsServer = () => {
  const p = getTsServerPath();
  if (!fs.existsSync(p)) {
    console.error("TS server not found at:", p);
    return;
  }

  childSpawnRef = spawn("node", [p], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  childSpawnRef.stdout.on("data", (data) => {
    console.log("TS Server stdout:", data.toString());
  });

  childSpawnRef.stderr.on("data", (data) => {
    console.error("TS Server stderr:", data.toString());
  });

  childSpawnRef.on("close", (code) => {
    console.log("TS Server exited with code", code);
  });

  console.log("TS Server started at", p);
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

      childSpawnRef.stdout.once("data", (data) => {
        let parsed;
        try {
          parsed = JSON.parse(data.toString());
        } catch {
          parsed = data.toString();
        }
        event.sender.send("tsserver-response", parsed);
      });
    }
  });
};

module.exports = { startTsServer, stopTsServer, registerTsListeners };
