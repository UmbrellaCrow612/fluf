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
 * Helper to write a mesage to the typescript stdin procsess
 * @param {import("./type").tsServerWritableObject} message The message to write to stdin stream of typescript processes
 */
function write(message) {
  if (!childSpawnRef) return; // TODO fix for safety

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
  // TODO resolve for seq resolve seq
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
      notifyUI(message);
    } catch (err) {
      logger.error("Failed to parse TS Server JSON:", jsonText.toString(), err);
    }
  }
};

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

    let exePath = await getTypescriptServerPath();

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
      logger.error("TS Server stderr:", data.toString());
    });

    childSpawnRef.on("close", (code) => {
      logger.info("TS Server exited with code", code);
    });

    isServerStarted = true;
    selectedWorkSpaceFolder = _workSpaceFolder;

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
  try {
    if (!isServerStarted) return false;
    if (!childSpawnRef) return false;

    try {
      await sendRequest(commandTypes.Exit, {});
    } catch (error) {
      logger.error("Typescript language server exit request timed out");
    }

    return new Promise((resolve) => {
      let forcedTimeoutId = setTimeout(() => {
        if (childSpawnRef) {
          childSpawnRef.kill("SIGKILL");
        }
        cleanState();
        resolve(true);
      }, 3000);

      childSpawnRef?.on("exit", () => {
        clearTimeout(forcedTimeoutId);
        cleanState();
        resolve(true);
      });
    });
  } catch (error) {
    logger.error(
      "Failed to stop Typescript language server " + JSON.stringify(error),
    );
    childSpawnRef?.kill();
    cleanState();
    return false;
  }
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
