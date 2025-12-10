/*
    Contains all the code to allow ts typescript language support for the UI editor
*/

const fs = require("fs");
const { spawn } = require("child_process");
const { getTsServerPath } = require("./packing");

/**
 * Refrence to the child processes spawned for the TS typescript server
 *  @type {import("child_process").ChildProcessWithoutNullStreams | null}
 */
let childSpawnRef = null;

/**
 * This buffer will accumulate raw data from tsserver's stdout.
 */
let stdoutBuffer = "";

const parseStdout = () => {};

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
  ipcMain.on(
    "tsserver:file:open",
    (_, filePath, fileContent, requestNumber) => {
      if (!childSpawnRef) return;

      childSpawnRef.stdin.write(
        JSON.stringify({
          seq: requestNumber,
          type: "request",
          command: "open",
          arguments: {
            file: filePath,
            fileContent: fileContent,
          },
        })
      );
    }
  );

  ipcMain.on("tsserver:file:edit", (_, filePath, newContent, requestNumber) => {
    if (!childSpawnRef) return;

    childSpawnRef.stdin.write(
      JSON.stringify({
        seq: requestNumber,
        type: "request",
        command: "updateOpen",
        arguments: {
          file: filePath,
          fileContent: newContent,
        },
      })
    );
  });

  ipcMain.on("tsserver:file:save", (_, filePath, requestNumber) => {
    if (!childSpawnRef) return;

    childSpawnRef.stdin.write(
      JSON.stringify({
        seq: requestNumber,
        type: "request",
        command: "save",
        arguments: {
          file: filePath,
        },
      })
    );
  });

  ipcMain.on("tsserver:file:close", (_, filePath, requestNumber) => {
    if (!childSpawnRef) return;

    childSpawnRef.stdin.write(
      JSON.stringify({
        seq: requestNumber,
        type: "request",
        command: "close",
        arguments: {
          file: filePath,
        },
      })
    );
  });
};

module.exports = { startTsServer, stopTsServer, registerTsListeners };
