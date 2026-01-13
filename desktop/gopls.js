/**
 * Contains all the code go go LSP to work
 *
 * DOCS: https://github.com/golang/tools/tree/master/gopls
 * FORK: https://github.com/UmbrellaCrow612/go-tools Where we build and download the binarys
 */

const { spawn } = require("child_process");
const { logger } = require("./logger");
const { binPath } = require("./packing");
const fs = require("fs/promises");
const path = require("path");
const { createUri } = require("./lsp");
const { binmanResolve } = require("umbr-binman");

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
 * Contains a map of specific file path and there document version
 */
const documentVersions = new Map();

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
  documentVersions.clear();
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
  const id = Number(message.id);
  if (message.id !== undefined && pendingRequest.has(id)) {
    const prom = pendingRequest.get(id);

    if (message.error) {
      prom?.reject(message.error);
    } else {
      prom?.resolve(message.result);
    }
    pendingRequest.delete(id);
  }

  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    mainWindowRef.webContents.send("go:message", message);
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
const startGoLanguageServer = async (_, workSpaceFolder) => {
  try {
    if (isServerActive) {
      logger.info(
        "Go language server already active for workspace " + workSpaceFolder,
      );
      return true;
    }

    const _workSpaceFolder = path.normalize(path.resolve(workSpaceFolder));
    await fs.access(_workSpaceFolder);

    let exePath = await binmanResolve("gopls", ["gopls"], binPath());
    if (!exePath) {
      throw new Error("No gopls exe path");
    }
    await fs.access(exePath);

    spawnRef = spawn(exePath, ["serve"]);

    spawnRef.stdout.on("data", (chunk) => {
      stdoutBuffer = Buffer.concat([stdoutBuffer, chunk]);
      parseStdin();
    });

    spawnRef.stderr.on("data", (chunk) => {
      logger.error("Go language server " + chunk.toString());
    });

    spawnRef.on("exit", (code) => {
      if (code == 1) {
        cleanState(); // any malformed request causes it to exit
      }
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

    logger.info("Attempting to initialize go lsp");
    await sendRequest("initialize", params);

    writeToStdin({
      jsonrpc: "2.0",
      method: "initialized",
      params: {},
    });

    if (mainWindowRef) {
      mainWindowRef.webContents.send("go:ready");
    }

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
 * @type {import("./type").goServerStop}
 */
const stopGoLanguageServer = async () => {
  try {
    if (!isServerActive || !spawnRef) return true;

    logger.info("Attempting to stop go lsp");

    try {
      await sendRequest("shutdown", {});
    } catch (error) {
      logger.error("Go shutdown requested hanged " + JSON.stringify(error));
    }

    writeToStdin({
      jsonrpc: "2.0",
      method: "exit",
    });

    return new Promise((resolve) => {
      let forceClearTimeout = setTimeout(() => {
        spawnRef?.kill();
        cleanState();
        resolve(true);

        logger.error("Forced go lsp exit");
      }, 3000);

      spawnRef?.on("exit", () => {
        clearTimeout(forceClearTimeout);
        cleanState();
        resolve(true);

        logger.info("Go lsp stoped");
      });
    });
  } catch (error) {
    logger.error("Failed to stop go language server " + JSON.stringify(error));
    return false;
  }
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainEventCallback, import("./type").goServerOpen>}
 */
const openImpl = (_, filePath, fileContent) => {
  try {
    let normfp = path.normalize(filePath);
    documentVersions.set(normfp, 1);

    /**
     * @type {import("vscode-languageserver-protocol").NotificationMessage}
     */
    let object = {
      jsonrpc: "2.0",
      /** @type {import("./type").LanguageServerProtocolMethod} */
      method: "textDocument/didOpen",
      /** @type {import("vscode-languageserver-protocol").DidOpenTextDocumentParams} */
      params: {
        textDocument: {
          languageId: "go",
          text: fileContent,
          uri: createUri(filePath),
          version: 1,
        },
      },
    };

    writeToStdin(object);
  } catch (error) {
    logger.error("Failed to open file in go lsp " + JSON.stringify(error));
  }
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainEventCallback, import("./type").goServerEdit>}
 */
const editImpl = (_, payload) => {
  try {
    let normfp = path.normalize(payload.filePath);
    let version = documentVersions.get(normfp) ?? 1;
    let newVersion = version + 1;
    documentVersions.set(normfp, newVersion);

    /**
     * @type {import("vscode-languageserver-protocol").NotificationMessage}
     */
    let object = {
      jsonrpc: "2.0",
      /** @type {import("./type").LanguageServerProtocolMethod} */
      method: "textDocument/didChange",

      /** @type {import("vscode-languageserver-protocol").DidChangeTextDocumentParams} */
      params: {
        textDocument: {
          uri: createUri(normfp),
          version: newVersion,
        },
        contentChanges: payload.changes,
      },
    };

    writeToStdin(object);
  } catch (error) {
    logger.error("Failed to edit document in go lsp");
  }
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").goServerisReady>}
 */
const isReadyImpl = async () => {
  return isServerActive;
};

/**
 * Register all gopls listeners
 * @param {import("electron").IpcMain} ipcMain
 * @param {import("electron").BrowserWindow | null} mainWindow
 */
const registerGoLanguageServerListeners = (ipcMain, mainWindow) => {
  mainWindowRef = mainWindow;

  ipcMain.handle("go:start", startGoLanguageServer);
  ipcMain.handle("go:stop", stopGoLanguageServer);

  ipcMain.handle("go:is:ready", isReadyImpl);

  ipcMain.on("go:open", openImpl);
  ipcMain.on("go:edit", editImpl);
};

module.exports = {
  registerGoLanguageServerListeners,
  startGoLanguageServer,
  stopGoLanguageServer,
};
