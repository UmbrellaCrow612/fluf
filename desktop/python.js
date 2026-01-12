/**
 * Contains the code for python lsp
 *
 * DOCS: https://microsoft.github.io/pyright/#/
 * LSP DOCS: https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/
 * Types: vscode-languageserver-protocol
 */

const { spawn } = require("child_process");
const { logger } = require("./logger");
const { getPythonServerPath } = require("./packing");
const fs = require("fs/promises");
const nodePath = require("path");
const { createUri } = require("./lsp");

/**
 * Indicates if the LSP has been started
 */
let initialized = false;
/**
 * If id the request for init
 * @type {number | null}
 */
let initializeRequestId = null;

let seq = 0;
/** Get the next number */
const getSeq = () => seq++;

/**
 * Refrence to the spawned lsp
 * @type {import("child_process").ChildProcessWithoutNullStreams | null}
 */
let spawnRef = null;

/**
 * Refrence to the main window
 * @type {import("electron").BrowserWindow | null}
 */
let mainWindowRef = null;

/**
 * Buffer that holds the stdout of the lsp output
 */
let stdoutBuffer = Buffer.alloc(0);

/**
 * If the server has been started for a given workspace folder
 */
let isServerStarted = false;

/**
 * Holds a refrence to the workspace selected
 * @type {string | null}
 */
let selectedWorkSpaceFolder = null;

/**
 * Holds promises for requests we made and are awaiting a response
 *
 * Number is the request ID and it's value is the promise for it
 * @type {Map<number, {resolve: (value: any) => void, reject: (reason?: any) => void}>}
 */
const pendingRequests = new Map();

/**
 * Contains a map of abs file paths and there version
 * @type {Map<string,number>}
 */
const documentVersions = new Map();

/**
 * Helper to send a request and return a promise
 * @param {import("./type").LanguageServerProtocolMethod} method
 * @param {any} params
 */
async function sendRequest(method, params) {
  const id = getSeq();
  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    write({
      jsonrpc: "2.0",
      id,
      method,
      params,
    });

    // Safety timeout: don't wait forever if the server hangs
    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error(`Request ${method} timed out`));
      }
    }, 5000);
  });
}

/**
 * Send the parsed response from the stdout to the UI
 * @param {import("vscode-languageserver-protocol").ResponseMessage} message The parsed response message
 */
function notifyUI(message) {
  if (message.id !== undefined && pendingRequests.has(Number(message.id))) {
    const object = pendingRequests.get(Number(message.id));
    pendingRequests.delete(Number(message.id));
    object?.resolve(message);
  }

  if (message.id === initializeRequestId && message.result && !initialized) {
    initialized = true;

    write({
      jsonrpc: "2.0",
      method: "initialized",
      params: {},
    });

    logger.info("Python language server initialized");
    if (mainWindowRef) {
      mainWindowRef.webContents.send("python:ready");
    }
  }

  if (!initialized && message.id !== undefined) {
    logger.warn(
      "Python language server not yet init ignoring message " +
        JSON.stringify(message),
    );
    return;
  }

  if (mainWindowRef) {
    mainWindowRef.webContents.send("python:message", message);
  } else {
    logger.error(
      "Python language LSP Message received, but mainWindowRef is null",
    );
  }
}
/**
 * Parses the buffer and sends it to UI
 */
function parseStdout() {
  while (true) {
    const sepIndex = stdoutBuffer.indexOf("\r\n\r\n");
    if (sepIndex === -1) break;

    const header = stdoutBuffer.subarray(0, sepIndex).toString("ascii");
    const match = header.match(/Content-Length: (\d+)/i);
    if (!match) {
      logger.error("No Content-Length found:", header);
      stdoutBuffer = stdoutBuffer.subarray(sepIndex + 4);
      continue;
    }

    const contentLength = parseInt(match[1], 10);
    const totalLength = sepIndex + 4 + contentLength;
    if (stdoutBuffer.length < totalLength) break;

    const contentBuffer = stdoutBuffer.subarray(sepIndex + 4, totalLength);
    try {
      const json = JSON.parse(contentBuffer.toString("utf-8"));
      notifyUI(json);
    } catch (err) {
      logger.error("Failed to parse JSON:", contentBuffer.toString("utf-8"));
    }

    stdoutBuffer = stdoutBuffer.subarray(totalLength);
  }
}

/**
 * Being the python language server, if it's already running it will ignore it whenever the workspace folder changes stop server then
 * restart them with the new workspace folder
 * @param {string} workSpaceFolder - The root folder selected
 * @returns {Promise<boolean>} If it could or could not start the lang server
 */
async function startPythonLanguageServer(workSpaceFolder) {
  try {
    if (isServerStarted) {
      logger.info(
        "Python language server already started in a given workspacen folder " +
          selectedWorkSpaceFolder,
      );
      return false;
    }

    const _workSpaceFolder = nodePath.normalize(
      nodePath.resolve(workSpaceFolder),
    );
    logger.info("Workspace folder provided " + _workSpaceFolder);

    await fs.access(_workSpaceFolder);

    const langServerPath = getPythonServerPath();
    await fs.access(langServerPath);

    spawnRef = spawn("node", [langServerPath, "--stdio"]);

    spawnRef.stdout.on("data", (chunk) => {
      stdoutBuffer = Buffer.concat([stdoutBuffer, chunk]);
      parseStdout();
    });

    spawnRef.stderr.on("data", (chunk) => {
      logger.error("Python Language server error:");
      logger.error(chunk.toString());
    });

    logger.info("Started python language server at " + langServerPath);

    // We need to initlize it
    initializeRequestId = getSeq();

    write({
      jsonrpc: "2.0",
      id: initializeRequestId,
      /** @type {import("./type").LanguageServerProtocolMethod}*/
      method: "initialize",

      /** @type {import("vscode-languageserver-protocol").InitializeParams} */
      params: {
        processId: spawnRef.pid ?? null,
        capabilities: {},
        workspaceFolders: [
          {
            uri: createUri(_workSpaceFolder),
            name: nodePath.basename(_workSpaceFolder) ?? "root",
          },
        ],
        clientInfo: {
          name: "Fluf",
          version: "1.0.0",
        },
        rootUri: createUri(_workSpaceFolder),
      },
    });

    isServerStarted = true;
    selectedWorkSpaceFolder = _workSpaceFolder;
    return true;
  } catch (error) {
    logger.error(
      "Failed to start python language server " + JSON.stringify(error),
    );
    return false;
  }
}

/**
 * Used when you want to reset state
 */
function cleanupState() {
  isServerStarted = false;
  selectedWorkSpaceFolder = null;
  spawnRef = null;
  initialized = false;
  initializeRequestId = null;
}

/**
 * Stops the python LSP gracefully by sending a shutdown request first
 * @returns {Promise<boolean>} If it could or could not stop it
 */
async function stopPythonLanguageServer() {
  try {
    if (!spawnRef) return false;

    if (initialized) {
      logger.info("Sending shutdown request for python language server");
      try {
        await sendRequest("shutdown", null);
      } catch (e) {
        logger.warn("Shutdown request timed out, forcing exit.");
      }

      write({
        jsonrpc: "2.0",
        method: "exit",
      });
    }

    return new Promise((resolve) => {
      const forceKillTimeout = setTimeout(() => {
        if (spawnRef) {
          logger.warn("Server didn't exit, killing process.");
          spawnRef.kill("SIGKILL");
        }
        cleanupState();
        resolve(true);
      }, 2000);

      spawnRef?.on("exit", () => {
        clearTimeout(forceKillTimeout);
        cleanupState();
        logger.info("Stopped python language server gracefully");
        resolve(true);
      });
    });
  } catch (error) {
    logger.error(
      "Failed to stop python language server: " + JSON.stringify(error),
    );
    spawnRef?.kill();
    cleanupState();
    return false;
  }
}

/**
 * Safe write with error handling
 * @param {Partial<import("vscode-languageserver-protocol").RequestMessage> | Partial<import("vscode-languageserver-protocol").NotificationMessage>} request
 */
function write(request) {
  if (!spawnRef || !spawnRef.stdin.writable) return;

  try {
    const json = JSON.stringify(request);
    const contentLength = Buffer.byteLength(json, "utf8");
    const message = `Content-Length: ${contentLength}\r\n\r\n${json}`;
    spawnRef.stdin.write(message);
  } catch (err) {
    logger.error("Failed to write to stdin: " + JSON.stringify(err));
  }
}



/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainEventCallback, import("./type").pythonServerOpen>}
 */
const openImpl = (_, filePath, fileContent) => {
  try {
    documentVersions.set(nodePath.normalize(filePath), 1);

    /**
     * @type {Partial<import("vscode-languageserver-protocol").RequestMessage>}
     */
    const object = {
      /** @type {import("./type").LanguageServerProtocolMethod} */
      method: "textDocument/didOpen",
      /** @type {import("./type").LanguageServerjsonrpc} */
      jsonrpc: "2.0",
      /** @type {import("vscode-languageserver-protocol").DidOpenTextDocumentParams } */
      params: {
        textDocument: {
          /** @type {import("./type").LanguageServerLanguageId} */
          languageId: "python",
          text: fileContent,
          version: 1,
          uri: createUri(filePath),
        },
      },
    };

    write(object);
  } catch (error) {
    logger.error(
      "Failed to open file in python language server " + JSON.stringify(error),
    );
  }
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").pythonServerStart>}
 */
const startImpl = async (_, fp) => {
  return await startPythonLanguageServer(fp);
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").pythonServerStop>}
 */
const stopImpl = async () => {
  return await stopPythonLanguageServer();
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").pythonServerEdit>}
 */
const editImpl = (_, payload) => {
  let normPath = nodePath.normalize(payload.filePath);
  let previousVersion = documentVersions.get(normPath) ?? 1;
  let newVersion = previousVersion + 1;
  documentVersions.set(normPath, newVersion);

  write({
    jsonrpc: "2.0",
    /** @type {import("./type").LanguageServerProtocolMethod} */
    method: "textDocument/didChange",
    /** @type {import("vscode-languageserver-protocol").DidChangeTextDocumentParams} */
    params: {
      textDocument: {
        version: newVersion,
        uri: createUri(normPath),
      },
      contentChanges: payload.changes,
    },
  });
};

/**
 * Register all python lsp related listeners
 * @param {import("electron").IpcMain} ipcMain
 * @param {import("electron").BrowserWindow | null} mainWindow
 */
const reigsterPythonLanguageServerListeners = (ipcMain, mainWindow) => {
  mainWindowRef = mainWindow;

  ipcMain.handle("python:start", startImpl);
  ipcMain.handle("python:stop", stopImpl);

  ipcMain.on("python:file:open", openImpl);
  ipcMain.on("python:file:edit", editImpl);
};

module.exports = {
  startPythonLanguageServer,
  stopPythonLanguageServer,
  reigsterPythonLanguageServerListeners,
};
