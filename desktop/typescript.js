/*
    Contains all the code to allow ts typescript language support for the UI editor
*/

const { getTsServerPath } = require("./packing");
const fs = require("fs");
const { spawn } = require("child_process");

/**
 * Refrence to the child processes spawned for the TS typescript server
 *  @type {import("child_process").ChildProcessWithoutNullStreams | null}
 */
let childSpawnRef = null;

/**
 * This buffer will accumulate raw data from tsserver's stdout.
 */
let stdoutBuffer = "";

// A place to store the Electron event sender to send responses back to the UI.
// This is necessary because tsserver responses are asynchronous and not tied to a single IPC event.
/** @type {((response: any) => void) | null} */
let tsServerResponseSender = null;

/**
 * Parse the stdout from ts server.
 * This function processes the buffer, extracts `all` complete messages,
 * calls the sender callback for each, and updates the global stdoutBuffer.
 * * @returns {void}
 */
const parseStdout = () => {
  const ContentLengthHeader = "Content-Length: ";

  while (true) {
    // 1. Find the end of the headers, marked by the protocol terminator (\r\n\r\n or \n\n).
    let headerEndIndex = stdoutBuffer.indexOf("\r\n\r\n");
    let headerTerminatorLength = 4;

    if (headerEndIndex === -1) {
      headerEndIndex = stdoutBuffer.indexOf("\n\n");
      headerTerminatorLength = 2;
    }

    if (headerEndIndex === -1) {
      // Not enough data to complete headers yet.
      return;
    }

    // 2. Extract the header section and find 'Content-Length'.
    const headerSection = stdoutBuffer.substring(0, headerEndIndex);
    const lengthIndex = headerSection.indexOf(ContentLengthHeader);

    if (lengthIndex === -1) {
      console.error("TS Server response missing Content-Length header.");
      // Skip the malformed message by advancing the buffer past the header terminator.
      stdoutBuffer = stdoutBuffer.substring(
        headerEndIndex + headerTerminatorLength
      );
      continue;
    }

    const lengthString = headerSection
      .substring(lengthIndex + ContentLengthHeader.length)
      .split(/\r?\n/)[0]
      .trim();

    const contentLength = parseInt(lengthString, 10);

    if (isNaN(contentLength)) {
      console.error("TS Server response Content-Length is not a number.");
      stdoutBuffer = stdoutBuffer.substring(
        headerEndIndex + headerTerminatorLength
      );
      continue;
    }

    // 3. Calculate the start and check for the full JSON payload.
    const payloadStartIndex = headerEndIndex + headerTerminatorLength;
    const totalMessageLength = payloadStartIndex + contentLength;

    if (stdoutBuffer.length < totalMessageLength) {
      // Not enough data to complete the message payload.
      return;
    }

    // 4. Extract the JSON payload.
    const payload = stdoutBuffer.substring(
      payloadStartIndex,
      totalMessageLength
    );

    // 5. Process the message and call the sender callback.
    try {
      const parsedMessage = JSON.parse(payload);
      if (tsServerResponseSender) {
        // Send the parsed JSON message back to the renderer process.
        tsServerResponseSender(parsedMessage);
      }
    } catch (e) {
      console.error("Failed to parse TS server JSON payload:", e);
    }

    // 6. Trim the buffer for the next message.
    stdoutBuffer = stdoutBuffer.substring(totalMessageLength);
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
  ipcMain.on("tsserver-send", (event, message) => {
    tsServerResponseSender = (response) => {
      event.sender.send("tsserver-response", response);
    };

    if (childSpawnRef) {
      childSpawnRef.stdin.write(JSON.stringify(message) + "\n");
    }
  });
};

module.exports = { startTsServer, stopTsServer, registerTsListeners };
