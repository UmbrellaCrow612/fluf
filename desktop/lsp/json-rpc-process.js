const { spawn } = require("child_process");
const { logger, logError } = require("../logger");
const { isUri } = require("./uri");
const fs = require("fs/promises");
const path = require("path");

/**
 * @typedef {import("../type").LanguageServerProtocolMethod} LanguageServerProtocolMethod
 */

/**
 * Used as a generic way to interact with a JSONRpc compliant LSP process that is spawned with the command combined with electron event sending,
 * this is done as electron `preload.js` cannot accept callbacks as params so we need to attach them in the `preload.js` file then send events to run said callbacks that where
 * attached in the `preload.js` file.
 *
 * @see https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/
 */
class JsonRpcProcess {
  /**
   * Command used to spawn the LSP
   * @type {string | null}
   */
  #command = null;

  /**
   * Get the command spawned for a given the given process
   * @returns {string | null}
   */
  GetCommand() {
    return this.#command;
  }

  /**
   * Aguments passed on spawn
   * @type {string[]}
   */
  #args = [];

  /**
   * The spawned child process
   * @type {import("child_process").ChildProcessWithoutNullStreams | null}
   */
  #spawnRef = null;

  /**
   * Indicates if the process has been started
   */
  #isStarted = false;

  /**
   * Check if the process is running
   * @returns {boolean} If it is or is not
   */
  IsStarted() {
    return this.#isStarted;
  }

  /**
   * Holds the pending requests made to the process
   *
   * - `Key` - The request ID
   * - `Value` - The promises reject and accept callbacks used to complete or fail it
   * @type {Map<number, {resolve: (value: any) => void, reject: (reason?: any) => void}>}
   */
  #pendingRequests = new Map();

  /** Holds the next ID  */
  #id = 0;
  /**
   * Gets the next id
   * @returns {number} - The next id
   */
  #getId() {
    return this.#id++;
  }

  /**
   * Holds the buffer data sent out from the stdin stream from the spawned cmd
   * @type {Buffer}
   */
  #stdoutBuffer = Buffer.alloc(0);

  /**
   * Holds the PID number of the spawend process
   * @type {number | undefined}
   */
  #pid = undefined;

  /**
   * Get the PID number of the process
   * @returns {number | undefined}
   */
  GetPid() {
    return this.#pid;
  }

  /**
   * Used to get the main window
   * @type {import("../type").getMainWindow | null}
   */
  #getMainWindow = null;

  /**
   * Refrence to the main window to send events
   * @type {import("electron").BrowserWindow | null}
   */
  #mainWindowRef = null;

  /**
   * Holds the workspace folder this was spawned for for exmaple `c:/dev/some/project`
   * @type {string | null}
   */
  #workSpaceFolder = null;

  /**
   * Holds the language this is for exmaple `go` or `js` etc
   * @type {import("../type").languageId | null}
   */
  #languageId = null;

  /**
   * Required for spawn of the process to work and properly spawn and communicate as needed
   * @param {string} command - The command to spawn the LSP such as `gopls` or the path to the binary
   * @param {string[]} args - Any addtional arguments to pass to the command on spawn such as `["--stdio"]`
   * @param {import("../type").getMainWindow | null} getMainWindow - Used to get the main window ref
   * @param {string} workSpaceFolder - The workspace this is for exmaple `c:/dev/some/project/`
   * @param {import("../type").languageId | null} languageId - The specific language this is for exmaple `go` or `js` etc
   */
  constructor(command, args, getMainWindow, workSpaceFolder, languageId) {
    if (!command || typeof command !== "string")
      throw new TypeError("command must be a non-empty string");

    if (!Array.isArray(args)) throw new TypeError("args must be an array");

    if (!args.every((arg) => typeof arg === "string"))
      throw new TypeError("all elements in args must be strings");

    if (typeof getMainWindow !== "function")
      throw new TypeError("getMainWindow is not a function");

    if (typeof workSpaceFolder !== "string")
      throw new TypeError("workSpaceFolder must be a non empty string");

    if (typeof languageId !== "string")
      throw new TypeError("languageId must be a non empty string");

    this.#command = command;
    this.#args = args;
    this.#getMainWindow = getMainWindow;
    this.#workSpaceFolder = path.normalize(workSpaceFolder);
    this.#languageId = languageId;
    this.#mainWindowRef = this.#getMainWindow();
  }

  /**
   * Start the process
   */
  async Start() {
    if (!this.#getMainWindow)
      throw new Error("getMainWindow is null cannot fetch main window");

    if (!this.#workSpaceFolder || this.#workSpaceFolder.length === 0)
      throw new TypeError("workSpaceFolder must be a non empty string");

    try {
      if (this.#isStarted) {
        logger.info(`JSON Rpc already started for command ${this.#command}`);
        return;
      }
      if (!this.#command) throw new Error("Command not passed");

      await fs.access(this.#workSpaceFolder);

      this.#spawnRef = spawn(this.#command, this.#args);

      this.#pid = this.#spawnRef.pid;

      this.#spawnRef.stdout.on("data", (chunk) => {
        this.#stdoutBuffer = Buffer.concat([this.#stdoutBuffer, chunk]);
        this.#parseStdout();
      });

      this.#spawnRef.stderr.on("data", (chunk) => {
        logger.error(`LSP stderr: ${chunk.toString()}`);
      });

      this.#spawnRef.on("error", (error) => {
        logger.error(`Process error for ${this.#command}: ${error.message}`);
        this.#isStarted = false;
        this.#pendingRequests.forEach(({ reject }) => {
          reject(new Error(`Process error: ${error.message}`));
        });
        this.#pendingRequests.clear();
      });

      this.#spawnRef.on("exit", (code, signal) => {
        logger.info(
          `Process ${this.#command} exited with code ${code}, signal ${signal}`,
        );
        this.#isStarted = false;
        this.#pendingRequests.forEach(({ reject }) => {
          reject(new Error(`Process exited with code ${code}`));
        });
        this.#pendingRequests.clear();
      });

      this.#isStarted = true;
    } catch (error) {
      this.#isStarted = false;

      logError(
        error,
        `Failed to start JSON RPC process with command ${this.#command} error: ${JSON.stringify(error)}`,
      );

      throw error;
    }
  }

  /**
   * Shutdown the process and cleanup resources - not the same as stop - this is like a extreme cleanup at the very end
   * @returns {void}
   */
  Shutdown() {
    this.#isStarted = false;

    if (this.#spawnRef && !this.#spawnRef.killed) {
      this.#spawnRef.kill("SIGTERM");

      setTimeout(() => {
        if (this.#spawnRef && !this.#spawnRef.killed) {
          this.#spawnRef.kill("SIGKILL");
        }
      }, 1000);
    }

    this.#pendingRequests.forEach(({ reject }) => {
      reject(new Error("Process shutdown"));
    });

    this.#pendingRequests.clear();
    this.#spawnRef = null;
    this.#mainWindowRef = null;
  }

  /**
   * Write exit request - call after `shutdown request`
   */
  Exit() {
    this.#write({
      jsonrpc: "2.0",
      method: "exit",
    });
  }

  /**
   * Call after making a initlized  request
   */
  Initialized() {
    this.#write({
      jsonrpc: "2.0",
      method: "initialized",
      params: {},
    });
  }

  /**
   * Make a request to the process and await a response
   * @param {import("../type").LanguageServerProtocolMethod} method - The specific method to send
   * @param {any} params - Any shape of params for the request being sent
   * @returns {Promise<any>} The promise to await and the value from the request parsed or error
   */
  SendRequest(method, params) {
    if (!method || typeof method !== "string")
      throw new TypeError("method must be a non-empty string");

    if (params !== undefined && params !== null && typeof params !== "object")
      throw new TypeError("params must be an object, null, or undefined");

    if (!this.#isStarted) {
      return Promise.reject(
        new Error(`Process not started for command: ${this.#command}`),
      );
    }

    try {
      let requestId = this.#getId();
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          if (this.#pendingRequests.has(requestId)) {
            this.#pendingRequests
              .get(requestId)
              ?.reject(new Error("Request timed out"));
            this.#pendingRequests.delete(requestId);
          }
        }, 4500);

        this.#pendingRequests.set(requestId, {
          resolve: (value) => {
            clearTimeout(timeoutId);
            resolve(value);
          },
          reject: (reason) => {
            clearTimeout(timeoutId);
            reject(reason);
          },
        });

        this.#write({
          id: requestId,
          jsonrpc: "2.0",
          method,
          params,
        });
      });
    } catch (error) {
      logError(
        error,
        `Failed to send request for command: ${this.#command} ${JSON.stringify(error)}`,
      );

      throw error;
    }
  }

  /**
   * Send a textDocument/didOpen notification to the LSP
   * @param {string} uri - The document URI (e.g., "file:///path/to/file.go")
   * @param {string} languageId - The language identifier (e.g., "go", "python", "javascript")
   * @param {number} version - The initial document version (typically starts at 1)
   * @param {string} text - The full text content of the document
   * @returns {void}
   */
  DidOpenTextDocument(uri, languageId, version, text) {
    if (!uri || typeof uri !== "string")
      throw new TypeError("uri must be a non-empty string");

    if (!languageId || typeof languageId !== "string")
      throw new TypeError("languageId must be a non-empty string");

    if (!isUri(uri)) throw new TypeError("uri must be a valid URI format");

    if (
      typeof version !== "number" ||
      !Number.isInteger(version) ||
      version < 0
    )
      throw new TypeError("version must be a non-negative integer");

    if (typeof text !== "string") throw new TypeError("text must be a string");

    this.#write({
      jsonrpc: "2.0",
      /** @type {import("../type").LanguageServerProtocolMethod} */
      method: "textDocument/didOpen",
      /** @type {import("vscode-languageserver-protocol").DidOpenTextDocumentParams} */
      params: {
        textDocument: {
          uri: uri,
          languageId: languageId,
          version: version,
          text: text,
        },
      },
    });
  }

  /**
   * Send a textDocument/didChange notification to the LSP
   * @param {string} uri - The document URI (e.g., "file:///path/to/file.go")
   * @param {number} version - The document version (increments with each change)
   * @param {import("vscode-languageserver-protocol").TextDocumentContentChangeEvent[]} contentChanges - The content changes
   * @returns {void}
   */
  DidChangeTextDocument(uri, version, contentChanges) {
    if (!uri || typeof uri !== "string")
      throw new TypeError("uri must be a non-empty string");

    if (!isUri(uri)) throw new TypeError("uri must be a valid URI format");

    if (
      typeof version !== "number" ||
      !Number.isInteger(version) ||
      version < 0
    )
      throw new TypeError("version must be a non-negative integer");

    if (!Array.isArray(contentChanges))
      throw new TypeError("contentChanges must be an array");

    this.#write({
      jsonrpc: "2.0",
      /** @type {import("../type").LanguageServerProtocolMethod} */
      method: "textDocument/didChange",
      /** @type {import("vscode-languageserver-protocol").DidChangeTextDocumentParams} */
      params: {
        textDocument: {
          uri: uri,
          version: version,
        },
        contentChanges: contentChanges,
      },
    });
  }

  /**
   * Send a textDocument/didClose notification to the LSP
   * @param {string} uri - The document URI (e.g., "file:///path/to/file.go")
   * @returns {void}
   */
  DidCloseTextDocument(uri) {
    if (!uri || typeof uri !== "string")
      throw new TypeError("uri must be a non-empty string");

    if (!isUri(uri)) throw new TypeError("uri must be a valid URI format");

    this.#write({
      jsonrpc: "2.0",
      /** @type {import("../type").LanguageServerProtocolMethod} */
      method: "textDocument/didClose",
      /** @type {import("vscode-languageserver-protocol").DidCloseTextDocumentParams} */
      params: {
        textDocument: {
          uri: uri,
        },
      },
    });
  }

  /**
   * Parses the stdout and notifies interested parties of the message parsed
   */
  #parseStdout() {
    while (true) {
      const headerEnd = this.#stdoutBuffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) {
        return;
      }

      const headers = this.#stdoutBuffer
        .subarray(0, headerEnd)
        .toString("utf-8");
      const contentLengthMatch = headers.match(/Content-Length: (\d+)/i);

      if (!contentLengthMatch) {
        logger.error("No Content-Length header found");
        this.#stdoutBuffer = this.#stdoutBuffer.subarray(headerEnd + 4);
        continue;
      }

      const contentLength = parseInt(contentLengthMatch[1], 10);
      const messageStart = headerEnd + 4;
      const messageEnd = messageStart + contentLength;

      if (this.#stdoutBuffer.length < messageEnd) {
        return;
      }

      const messageBody = this.#stdoutBuffer
        .subarray(messageStart, messageEnd)
        .toString("utf-8");

      // Move buffer advancement BEFORE parsing to prevent infinite loops
      this.#stdoutBuffer = this.#stdoutBuffer.subarray(messageEnd);

      let response;
      try {
        response = JSON.parse(messageBody);
      } catch (/** @type {any}*/ err) {
        logError(err, `Failed to parse JSON for command: ${this.#command}`);
        logger.error("Raw body: " + messageBody);
        continue;
      }

      try {
        this.#handle(response);
      } catch (/** @type {any}*/ err) {
        logError(
          err,
          `Failed to notify response for command: ${this.#command}`,
        );
        // Continue processing even if notification fails
      }
    }
  }

  /**
   * Handles a response message from the LSP and notifies any listeners
   * @param {import("vscode-languageserver-protocol").ResponseMessage} response
   */
  #handle(response) {
    // We need to resolve pending requests first to stop hanging
    if (
      response.id !== null &&
      this.#pendingRequests.has(Number(response.id))
    ) {
      const obj = this.#pendingRequests.get(Number(response.id));

      if (response.error) {
        obj?.reject(response.error);

        // Check if window still exists before sending error event
        if (this.#mainWindowRef && !this.#mainWindowRef.isDestroyed()) {
          this.#mainWindowRef.webContents.send("lsp:error", {
            error: response.error,
            id: response.id,
            languageId: this.#languageId,
            workSpaceFolder: this.#workSpaceFolder,
          });
        }
      } else {
        obj?.resolve(response.result);
      }

      this.#pendingRequests.delete(Number(response.id));
    }

    // Check if window still exists before sending data event
    if (this.#mainWindowRef && !this.#mainWindowRef.isDestroyed()) {
      this.#mainWindowRef.webContents.send("lsp:data", {
        response: response,
        languageId: this.#languageId,
        workSpaceFolder: this.#workSpaceFolder,
      });
    }

    this.#notify(response);
  }

  /**
   * Notify interested parties of a notification message from the LSP
   * @param {any} notification - The notification message
   * @returns {void} Nothing
   */
  #notify(notification) {
    if (!notification || typeof notification !== "object")
      throw new TypeError("notification must be an object");

    if (!this.#getMainWindow)
      throw new Error("getMainWindow is null cannot get main window");

    if (!this.#mainWindowRef) {
      this.#mainWindowRef = this.#getMainWindow();
    }

    if (!this.#mainWindowRef)
      throw new Error("main window is null cannot send events");

    if (this.#mainWindowRef.isDestroyed()) {
      logger.warn(
        `Main window destroyed, cannot send LSP events for command: ${this.#command}`,
      );
      return;
    }

    if (!this.#languageId) throw new Error("No language id cannot send events");
    if (!this.#workSpaceFolder)
      throw new Error("No workspace folder cannot send events");

    if (
      notification.method &&
      (notification.id === undefined || notification.id === null)
    ) {
      this.#mainWindowRef.webContents.send("lsp:notification", {
        method: notification.method,
        params: notification.params,
        languageId: this.#languageId,
        workSpaceFolder: this.#workSpaceFolder,
      });

      /** @type {import("../type").LanguageServerNotificationResponse} */
      let notificationData = {
        languageId: this.#languageId,
        workSpaceFolder: this.#workSpaceFolder,
        params: notification?.params,
      };

      this.#mainWindowRef.webContents.send(
        `lsp:notification:${notification.method}`,
        notificationData,
      );
    }
  }

  /**
   * Write a request to the stdin stream of the process
   * @param {Partial<import("vscode-languageserver-protocol").RequestMessage>} message The message
   */
  #write(message) {
    if (!message || typeof message !== "object")
      throw new TypeError("message must be an object");

    if (!this.#isStarted) {
      logger.error(
        `Cannot write to process command: ${this.#command} as it is not yet started`,
      );
      return;
    }

    if (!this.#spawnRef) {
      logger.error(`No child process spawned for command: ${this.#command}`);
      throw new Error("Trying to write to child process but it is undefined");
    }

    if (!this.#spawnRef.stdin.writable) {
      logger.error(`Cannot write to process command: ${this.#command}`);
      throw new Error(
        "Trying to write to child process but stdin is not writable",
      );
    }

    try {
      const json = JSON.stringify(message);
      const contentLength = Buffer.byteLength(json, "utf8");
      const writeContent = `Content-Length: ${contentLength}\r\n\r\n${json}`;
      this.#spawnRef.stdin.write(writeContent);
    } catch (error) {
      logError(
        error,
        `Failed to write to stdin stream of command: ${this.#command} error: ${JSON.stringify(error)}`,
      );

      throw error;
    }
  }
}

module.exports = { JsonRpcProcess };
