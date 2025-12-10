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

/** Request sequencse number  */
let seq = 0;

/** Get the next seq  */
const getNextSeq = () => seq++;

/**
 * Callback used to send the latest TS messages
 * @type {((message: tsServerOutput) => void) | null}
 */
let notifyUI = null;

/** @type {number | null} */
let pendingContentLength = null;

const parseStdout = () => {
  while (true) {
    // Step 1: Parse header if we don't know body length yet
    if (pendingContentLength === null) {
      const headerEnd = stdoutBuffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) return; // Wait for full header

      const header = stdoutBuffer.slice(0, headerEnd).toString();
      const match = header.match(/Content-Length:\s*(\d+)/i);
      if (!match) {
        console.error("Invalid TS Server header:", header);
        stdoutBuffer = stdoutBuffer.slice(headerEnd + 4);
        continue;
      }

      pendingContentLength = parseInt(match[1], 10);
      stdoutBuffer = stdoutBuffer.slice(headerEnd + 4);
    }

    // Step 2: Check if we have full body
    if (stdoutBuffer.length < pendingContentLength) return;

    const jsonText = stdoutBuffer.slice(0, pendingContentLength);
    stdoutBuffer = stdoutBuffer.slice(pendingContentLength);
    pendingContentLength = null;

    try {
      const message = JSON.parse(jsonText);
      handleTsMessage(message);
    } catch (err) {
      console.error(
        "Failed to parse TS Server JSON:",
        jsonText.toString(),
        err
      );
    }
  }
};

/**
 * Handle TS server messages
 * @param {tsServerOutput} message
 */
const handleTsMessage = (message) => {
  if (notifyUI) {
    notifyUI(message);
  }
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
    console.log(" YO " + data)
    parseStdout();
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
  ipcMain.on("tsserver:file:open", (event, filePath, fileContent) => {
    if (!childSpawnRef) return;

    if (!notifyUI) {
      notifyUI = (message) => {
        event.sender.send(`tsserver:message`, message);
      };
    }

    childSpawnRef.stdin.write(
      JSON.stringify({
        seq: getNextSeq(),
        type: "request",
        command: "open",
        arguments: {
          file: filePath,
          fileContent: fileContent,
        },
      }) + "\n"
    );
  });

  ipcMain.on("tsserver:file:edit", (event, filePath, newContent) => {
    if (!childSpawnRef) return;

    if (!notifyUI) {
      notifyUI = (message) => {
        event.sender.send(`tsserver:message`, message);
      };
    }

    childSpawnRef.stdin.write(
      JSON.stringify({
        seq: getNextSeq(),
        type: "request",
        command: "updateOpen",
        arguments: {
          file: filePath,
          fileContent: newContent,
        },
      }) + "\n"
    );
  });

  ipcMain.on("tsserver:file:save", (event, filePath) => {
    if (!childSpawnRef) return;

    if (!notifyUI) {
      notifyUI = (message) => {
        event.sender.send(`tsserver:message`, message);
      };
    }

    childSpawnRef.stdin.write(
      JSON.stringify({
        seq: getNextSeq(),
        type: "request",
        command: "save",
        arguments: {
          file: filePath,
        },
      }) + "\n"
    );
  });

  ipcMain.on("tsserver:file:close", (event, filePath) => {
    if (!childSpawnRef) return;

    if (!notifyUI) {
      notifyUI = (message) => {
        event.sender.send(`tsserver:message`, message);
      };
    }

    childSpawnRef.stdin.write(
      JSON.stringify({
        seq: getNextSeq(),
        type: "request",
        command: "close",
        arguments: {
          file: filePath,
        },
      }) + "\n"
    );
  });
};

module.exports = { startTsServer, stopTsServer, registerTsListeners };
