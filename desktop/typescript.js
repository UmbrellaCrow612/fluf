/**
 * Contains all the code for Typescript Language server support
 *
 * DOCS: https://github.com/microsoft/TypeScript/wiki/Standalone-Server-(tsserver)
 * Types: require("typescript").server.protocol
 */

const fs = require("fs/promises");
const { spawn } = require("child_process");
const { logger } = require("./logger");
const nodePath = require("path");
const { getTypescriptServerPath } = require("./packing");

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
 * @type {Buffer}
 */
let stdoutBuffer = Buffer.alloc(0);

/**
 * Indicates if the Typescript Language server has been started
 */
let isServerStarted = false;

/**
 * Holds a the current selected workspace folder that the lang server was started in
 * @type {string | null}
 */
let selectedWorkSpaceFolder = null;

/** Request sequencse number  */
let seq = 0;

/** Get the next seq  */
const getNextSeq = () => seq++;

/**
 * Contains a list of pedning request that require a response
 * @type {Map<number, {resolve: (value: any) => void, reject: (reason?: any) => void}>}
 */
const pendingRequests = new Map();

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
 * Resetss state
 */
function cleanState() {
  selectedWorkSpaceFolder = null;
  isServerStarted = false;
  childSpawnRef = null;
}

/**
 * Used to send a request and wait for a response or reject it
 * @param {import("typescript").server.protocol.CommandTypes} cmd
 * @param {any} args
 * @returns {Promise<any>}
 */
function sendRequest(cmd, args) {
  let id = getNextSeq();
  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    write({
      arguments: args,
      command: cmd,
      seq: id,
      type: "request",
    });

    // fallback for hanging
    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error(`Request ${cmd} timed out`));
      }
    }, 5000);
  });
}

/**
 * Helper to write a message to the typescript stdin process.
 * @param {import("./type").tsServerWritableObject} message - What you wan to write to it
 */
function write(message) {
  if (!childSpawnRef || !childSpawnRef.stdin || !childSpawnRef.stdin.writable) {
    logger.error("tsserver stdin is not available or writable.");
    return;
  }

  try {
    const jsonBody = JSON.stringify(message);
    const messageString = `${jsonBody}\n`;

    childSpawnRef.stdin.write(messageString, "utf8");
  } catch (error) {
    logger.error(
      "Failed to stringify or write to tsserver " + JSON.stringify(error),
    );
  }
}

/**
 * Callback used to send the latest TS messages to the main window
 * @type {(message: import("./type").tsServerOutput) => void}
 */
let notifyUI = (message) => {
  if (message.seq && pendingRequests.has(message.seq)) {
    let pend = pendingRequests.get(message.seq);
    pend?.resolve(message);
    pendingRequests.delete(message.seq);
    logger.info("Request fulifled " + message.seq);
  }

  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    mainWindowRef.webContents.send("tsserver:message", message);
  }
};

/**
 * Parses the stdout and notifys UI
 */
function parseStdout() {
  while (true) {
    const str = stdoutBuffer.toString("utf8");

    // 1. Find the Content-Length header
    const headerMatch = str.match(/Content-Length: (\d+)\r\n\r\n/);
    if (!headerMatch) {
      break; // Haven't received a full header yet
    }

    const headerString = headerMatch[0];
    const contentLength = parseInt(headerMatch[1], 10);

    // 2. Calculate indices
    const headerStart = stdoutBuffer.indexOf(headerString);
    const bodyStart = headerStart + Buffer.byteLength(headerString, "utf8");
    const bodyEnd = bodyStart + contentLength;

    // 3. Check if the full body has arrived
    if (stdoutBuffer.length < bodyEnd) {
      break; // Wait for more data
    }

    // 4. Extract the JSON body
    const bodyBuffer = stdoutBuffer.slice(bodyStart, bodyEnd);
    const bodyStr = bodyBuffer.toString("utf8");

    try {
      const message = JSON.parse(bodyStr);
      notifyUI(message);
    } catch (e) {
      logger.error(
        "Failed to parse tsserver message body " + JSON.stringify(e),
      );
    }

    stdoutBuffer = stdoutBuffer.subarray(bodyEnd);

    if (stdoutBuffer.length === 0) break;
  }
}

/**
 * Starts the typescript language server
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").tsServerStart>}
 */
const startTypeScriptLanguageServer = async (_, workspacefolder) => {
  try {
    if (isServerStarted) {
      logger.info(
        "Typescript language server already started at " + workspacefolder,
      );
      return true;
    }

    let exePath = getTypescriptServerPath();

    await fs.access(exePath);

    const _workSpaceFolder = nodePath.normalize(
      nodePath.resolve(workspacefolder),
    );
    await fs.access(_workSpaceFolder);

    childSpawnRef = spawn("node", [exePath]);

    childSpawnRef.stdout.on("data", (data) => {
      stdoutBuffer = Buffer.concat([stdoutBuffer, data]);
      parseStdout();
    });

    childSpawnRef.stderr.on("data", (data) => {
      logger.error("TS Server stderr: " + data.toString());
    });

    childSpawnRef.on("close", (code) => {
      logger.info("Typescript language server exited with code " + code);
    });

    isServerStarted = true;
    selectedWorkSpaceFolder = _workSpaceFolder;

    if(mainWindowRef){
      mainWindowRef.webContents.send("tsserver:ready")
    }

    logger.info("Typescript language server started from " + exePath)
    return true;
  } catch (error) {
    logger.error(
      "Failed to start Typescript language server " + JSON.stringify(error),
    );
    return false;
  }
};

/**
 * Stops the typescript language server
 * @type {import("./type").tsServerStop}
 */
const stopTypescriptLanguageServer = async () => {
  if (!isServerStarted || !childSpawnRef) return false;

  write({
    seq: getNextSeq(),
    type: "request",
    command: commandTypes.Exit,
    arguments: {},
  });

  return new Promise((resolve) => {
    const killTimer = setTimeout(() => {
      if (childSpawnRef) {
        logger.warn("Forcing tsserver shutdown");
        childSpawnRef.kill("SIGKILL");
      }
      cleanState();
      resolve(true);
    }, 3000);

    childSpawnRef?.once("exit", () => {
      clearTimeout(killTimer);
      cleanState();
      resolve(true);
    });
  });
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainEventCallback, import("./type").tsServerOpenFile>}
 */
const openFileImpl = (_, filePath, content) => {
  write(s.Open(nodePath.normalize(nodePath.resolve(filePath)), content));
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
      file: nodePath.normalize(nodePath.resolve(args.file)),
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
  write(s.Close(nodePath.normalize(nodePath.resolve(filePath))));
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
        file: nodePath.normalize(nodePath.resolve(args.file)),
      },
  };

  write(obj);
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainEventCallback, import("./type").tsServerError>}
 */
const getErrorImpl = (_, filePath) => {
  write(s.Geterr(nodePath.normalize(nodePath.resolve(filePath))));
};

/**
 * Register all TS main events listeners
 * @param {import("electron").IpcMain} ipcMain - The IPC main to add handlers to
 * @param {import("electron").BrowserWindow | null} win - Main window object, needed here becuase it needs to send agnostic events regardless of input events
 */
const registerTsListeners = (ipcMain, win) => {
  mainWindowRef = win;

  ipcMain.handle("tsserver:start", startTypeScriptLanguageServer);
  ipcMain.handle("tsserver:stop", stopTypescriptLanguageServer);

  ipcMain.on("tsserver:file:open", openFileImpl);
  ipcMain.on("tsserver:file:edit", editFileImpl);
  ipcMain.on("tsserver:file:close", closeFileImpl);
  ipcMain.on("tsserver:file:completion", completionImpl);
  ipcMain.on("tsserver:file:error", getErrorImpl);
};

module.exports = {
  startTypeScriptLanguageServer,
  stopTypescriptLanguageServer,
  registerTsListeners,
};
