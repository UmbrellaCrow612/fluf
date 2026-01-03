/*
    Contains all the code to allow ts typescript language support for the UI editor
*/

const fs = require("fs");
const { spawn } = require("child_process");
const { getTsServerPath } = require("./packing");
const { logger } = require("./logger");
const path = require("path");

// Open typescript.d.ts and for each cmd look for it's request interface for it and then import that type for it's arguments for you to pass the
// correct arguments for said cmd

/**
 * All the commands that ts server accepts through the std in stream for a request object
 *  @type {typeof import("typescript").server.protocol.CommandTypes}
 */
const commandTypes = require("typescript").server.protocol.CommandTypes;

/**
 *  A local ref to main window
 * @type {import("electron").BrowserWindow | null}
 */
let mainWindowRef = null;

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

/** Used as a helper to make really simple objects that are used in multiple places but do not change - The name is `s` for simple  */
const s = {
  /**
   * Make a Geterr object
   * @param  {...string} files
   * @returns {import("./type").tsServerWritableObject} Writable object
   */
  Geterr: (...files) => {
    return {
      seq: getNextSeq(),
      type: "request",
      command: commandTypes.Geterr,
      /** @type {import("typescript").server.protocol.GeterrRequestArgs}*/ arguments:
        {
          files: [...files],
          delay: 250,
        },
    };
  },

  /**
   * Create a close file object
   * @param {string} filePath - The file path
   * @returns {import("./type").tsServerWritableObject}
   */
  Close: (filePath) => {
    return {
      seq: getNextSeq(),
      type: "request",
      command: commandTypes.Close,
      /** @type {import("typescript").server.protocol.FileRequestArgs}*/ arguments:
        {
          file: filePath,
        },
    };
  },

  /**
   * Create an open object
   * @param {string} filePath The path to the file
   * @param {string} fileContent - The files content
   * @returns {import("./type").tsServerWritableObject}
   */
  Open: (filePath, fileContent) => {
    return {
      seq: getNextSeq(),
      type: "request",
      command: commandTypes.Open,
      /** @type {import("typescript").server.protocol.OpenRequestArgs}*/ arguments:
        {
          file: filePath,
          fileContent: fileContent,
        },
    };
  },
};

/**
 * Helper to write a mesage to the typescript stdin procsess
 * @param {import("./type").tsServerWritableObject} message The message to write to stdin stream of typescript processes
 */
function write(message) {
  if (!childSpawnRef) return;

  try {
    childSpawnRef.stdin.write(JSON.stringify(message) + "\n"); // new line to make each message seperate
  } catch (error) {
    logger.error("Failed to write to tserver " + JSON.stringify(error));
  }
}

/**
 * Callback used to send the latest TS messages to the main window
 * @type {(message: import("./type").tsServerOutput) => void}
 */
let notifyUI = (message) => {
  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    mainWindowRef.webContents.send("tsserver:message", message);
  }
};

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
        logger.error("Invalid TS Server header:", header);
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
      logger.error("Failed to parse TS Server JSON:", jsonText.toString(), err);
    }
  }
};

/**
 * Handle TS server messages
 * @param {import("./type").tsServerOutput} message
 */
const handleTsMessage = (message) => {
  notifyUI(message);
};

const startTsServer = () => {
  const path = getTsServerPath();
  if (!fs.existsSync(path)) {
    logger.error("TS server not found at:", path);
    return;
  }

  childSpawnRef = spawn("node", [path]);

  childSpawnRef.stdout.on("data", (data) => {
    stdoutBuffer += data.toString();
    parseStdout();
  });

  childSpawnRef.stderr.on("data", (data) => {
    logger.error("TS Server stderr:", data.toString());
  });

  childSpawnRef.on("close", (code) => {
    logger.info("TS Server exited with code", code);
  });

  logger.info("TS Server started at", path);
};

/**
 * Trys to kill TS child processes that was spawned
 */
const stopTsServer = () => {
  if (childSpawnRef) {
    childSpawnRef.kill();
    logger.info("Killed TS server");
    childSpawnRef = null;
  } else {
    logger.info("No TS server process to kill");
  }
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainEventCallback, import("./type").tsServerOpenFile>}
 */
const openFileImpl = (_, filePath, content) => {
  write(s.Open(path.normalize(path.resolve(filePath)), content));
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainEventCallback, import("./type").tsServerEditFile>}
 */
const editFileImpl = (_, args) => {
  /** @type {import("./type").tsServerWritableObject} */
  let cObj = {
    /** @type {import("typescript").server.protocol.ChangeRequestArgs} */
    arguments: {
      ...args,
      file: path.normalize(path.resolve(args.file)),
    },
    command: commandTypes.Change,
    seq: getNextSeq(),
    type: "request",
  };

  write(cObj);
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainEventCallback, import("./type").tsServerCloseFile>}
 */
const closeFileImpl = (_, filePath) => {
  write(s.Close(path.normalize(path.resolve(filePath))));
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainEventCallback, import("./type").tsServerCompletion>}
 */
const completionImpl = (_, args) => {
  /** @type {import("./type").tsServerWritableObject}*/
  let obj = {
    seq: getNextSeq(),
    type: "request",
    command: commandTypes.CompletionInfo,
    /** @type {import("typescript").server.protocol.CompletionsRequestArgs}*/ arguments:
      {
        ...args,
        file: path.normalize(path.resolve(args.file)),
      },
  };

  write(obj);
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainEventCallback, import("./type").tsServerError>}
 */
const getErrorImpl = (_, filePath) => {
  write(s.Geterr(path.normalize(path.resolve(filePath))));
};

/**
 * Register all TS main events listeners
 * @param {import("electron").IpcMain} ipcMain - The IPC main to add handlers to
 * @param {import("electron").BrowserWindow | null} win - Main window object, needed here becuase it needs to send agnostic events regardless of input events
 */
const registerTsListeners = (ipcMain, win) => {
  mainWindowRef = win;

  ipcMain.on("tsserver:file:open", openFileImpl);
  ipcMain.on("tsserver:file:edit", editFileImpl);
  ipcMain.on("tsserver:file:close", closeFileImpl);
  ipcMain.on("tsserver:file:completion", completionImpl);
  ipcMain.on("tsserver:file:error", getErrorImpl);
};

module.exports = { startTsServer, stopTsServer, registerTsListeners };
