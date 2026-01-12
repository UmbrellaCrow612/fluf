/**
 * Contains all the code go go LSP to work
 *
 * DOCS: https://github.com/golang/tools/tree/master/gopls
 * FORK: https://github.com/UmbrellaCrow612/go-tools Where we build and download the binarys
 */

const { spawn } = require("child_process");
const { logger } = require("./logger");
const { getGoServerPath } = require("./packing");
const fs = require("fs/promises");
const path = require("path");
const { createUri } = require("./lsp");

/**
 * Refrence to the main window
 * @type {import("electron").BrowserWindow | null}
 */
let mainWindowRef = null;

/**
 * @type {string | null}
 */
let selectedWorkSpaceFolder = null;

/**
 * Holds refrence to the child processes spawned for gopls
 * @type {import("child_process").ChildProcessWithoutNullStreams | null}
 */
let spawnRef = null;

/**
 * Holds the stdout buffer of the spaened process
 */
let stdoutBuffer = Buffer.alloc(0);

/**
 * Indicates if the lsp is currently running or not and also used as a way to indicate if it's been initlized
 */
let isServerActive = false;

/** Holds a sequence counter for request id's */
let seq = 0;

/** Gte the next sequence number used for request id's */
const getSeq = () => seq++;

/**
 * Holds refrence to specific requests made and there resolvers
 * @type {Map<number, {resolve: (value: any) => void, reject: (reason?: any) => void}>}
 */
const pendingRequest = new Map();

/**
 * Resets state of variable used
 */
function cleanState() {
  if (spawnRef) {
    spawnRef.kill();
  }

  spawnRef = null;
  selectedWorkSpaceFolder = null;
  stdoutBuffer = Buffer.alloc(0);
  isServerActive = false;
  seq = 0;
  Array.from(pendingRequest.values()).forEach((x) => x.reject());
  pendingRequest.clear();
}

/**
 * Send a request and wait for a respons or fail it
 * @param {import("./type").LanguageServerProtocolMethod} method - The method to send
 * @param {any} params Any addtional params
 */
function sendRequest(method, params) {
  let id = getSeq();

  return new Promise((resolve, reject) => {
    pendingRequest.set(id, { resolve, reject });
    writeToStdin({
      id,
      jsonrpc: "2.0",
      method: method,
      params: params,
    });

    setTimeout(() => {
      // fail safe for hanged
      if (pendingRequest.has(id)) {
        pendingRequest.get(id)?.reject();
        pendingRequest.delete(id);
      }
    }, 5000);
  });
}

/**
 * Write to the stdin stream of the child process
 * @param {Partial<import("vscode-languageserver-protocol").RequestMessage> | Partial<import("vscode-languageserver-protocol").NotificationMessage>} message - The JSON RPC message
 */
function writeToStdin(message) {
  if (!spawnRef || !spawnRef.stdin.writable) {
    logger.error("Failed to write to go lsp stdin stream");
    return;
  }

  try {
    const json = JSON.stringify(message);
    const contentLength = Buffer.byteLength(json, "utf8");
    const writeContent = `Content-Length: ${contentLength}\r\n\r\n${json}`;
    spawnRef.stdin.write(writeContent);
  } catch (error) {
    logger.error(
      "Failed to write to go lsp stream or JSON stringify " +
        JSON.stringify(error),
    );
  }
}

/**
 * Handles LSP messages / notifcations / responses that are parsed
 * @param {import("vscode-languageserver-protocol").ResponseMessage} message
 */
function handleLspResponse(message) {
  if (message.id !== undefined && pendingRequest.has(Number(message.id))) {
    pendingRequest.get(Number(message.id))?.resolve(true);
    pendingRequest.delete(Number(message.id));
  }

  if (mainWindowRef) {
    mainWindowRef.webContents.send("go:message", message);
  } else {
    logger.error("No main window ref to sedn go lsp message");
  }
}

/**
 * Parses the stdin then hands it off to a handler
 */
function parseStdin() {
  while (true) {
    const headerEnd = stdoutBuffer.indexOf("\r\n\r\n");
    if (headerEnd === -1) {
      return;
    }

    const headers = stdoutBuffer.subarray(0, headerEnd).toString("utf-8");
    const contentLengthMatch = headers.match(/Content-Length: (\d+)/i);

    if (!contentLengthMatch) {
      console.error("No Content-Length header found");
      stdoutBuffer = stdoutBuffer.subarray(headerEnd + 4);
      continue;
    }

    const contentLength = parseInt(contentLengthMatch[1], 10);
    const messageStart = headerEnd + 4;
    const messageEnd = messageStart + contentLength;

    if (stdoutBuffer.length < messageEnd) {
      return;
    }

    const messageBody = stdoutBuffer
      .subarray(messageStart, messageEnd)
      .toString("utf-8");

    try {
      const message = JSON.parse(messageBody);
      handleLspResponse(message);
    } catch (err) {
      logger.error("Failed to parse go lsp message " + JSON.stringify(err));
      logger.info("Raw body " + messageBody);
    }

    stdoutBuffer = stdoutBuffer.subarray(messageEnd);
  }
}

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").goServerStart>}
 */
const startGoPlsImpl = async (_, workSpaceFolder) => {
  try {
    if (isServerActive) {
      logger.info(
        "Go language server already active for workspace " + workSpaceFolder,
      );
      return true;
    }

    const _workSpaceFolder = path.normalize(path.resolve(workSpaceFolder));
    await fs.access(_workSpaceFolder);

    let exePath = getGoServerPath();
    await fs.access(exePath);

    let spawnRef = spawn(exePath, ["serve"]);

    spawnRef.stdout.on("data", (chunk) => {
      stdoutBuffer = Buffer.concat([stdoutBuffer, chunk]);
      parseStdin();
    });

    spawnRef.stderr.on("data", (chunk) => {
      logger.error("Go language server " + chunk.toString());
    });

    /** @type {import("vscode-languageserver-protocol").InitializeParams} */
    let params = {
      capabilities: {
        experimental: true,
      },
      processId: spawnRef.pid ?? null,
      clientInfo: {
        name: path.basename(_workSpaceFolder),
        version: "1",
      },
      workspaceFolders: [
        {
          name: path.basename(_workSpaceFolder),
          uri: createUri(_workSpaceFolder),
        },
      ],
      rootUri: createUri(_workSpaceFolder),
    };

    await sendRequest("initialize", params);

    writeToStdin({
      jsonrpc: "2.0",
      method: "initialized",
      params: {},
    });

    logger.info("Started go language server from " + exePath);

    selectedWorkSpaceFolder = _workSpaceFolder;
    isServerActive = true;
    return true;
  } catch (error) {
    logger.error("Failed to start go language server " + JSON.stringify(error));
    cleanState();
    return false;
  }
};

/**
 * Register all gopls listeners
 * @param {import("electron").IpcMain} ipcMain
 * @param {import("electron").BrowserWindow | null} mainWindow
 */
const registerGoPlsListeners = (ipcMain, mainWindow) => {
  mainWindowRef = mainWindow;

  ipcMain.handle("go:start", startGoPlsImpl);
};

module.exports = { registerGoPlsListeners };
