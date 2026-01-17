const { spawn } = require("child_process");
const { logger } = require("../logger");

/**
 * Used as a generic way to interact with a JSONRpc compliant LSP process that is spawned with the command.
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
   * Check if the process ir running
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
   * Holds all the listener  callbacks to be run when a lsp response is parsed
   * @type {Set<import("../type").LanguageServerOnDataCallback>}
   */
  #onDataCallbacks = new Set();

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
   * Required for spawn of the LSP
   * @param {string} command - The command to spawn the LSP such as `gopls` or the path to the binary
   * @param {string[]} args - Any addtional arguments to pass to the command on spawn such as `["--stdio"]`
   */
  constructor(command, args = []) {
    if (!command || typeof command !== "string")
      throw new TypeError("command must be a non-empty string");

    if (!Array.isArray(args)) throw new TypeError("args must be an array");

    if (!args.every((arg) => typeof arg === "string"))
      throw new TypeError("all elements in args must be strings");

    this.#command = command;
    this.#args = args;
  }

  /**
   * Start the process
   * @returns {void}
   */
  Start() {
    try {
      if (this.#isStarted) {
        logger.info(`JSON Rpc already started for command ${this.#command}`);
        return;
      }
      if (!this.#command) throw new Error("Command not passed");
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

      logger.error(
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
    if (this.#spawnRef && !this.#spawnRef.killed) {
      this.#spawnRef.kill();
    }

    this.#pendingRequests.forEach(({ reject }) => {
      reject(new Error("Process shutdown"));
    });

    this.#pendingRequests.clear();
    this.#onDataCallbacks.clear();
    this.#isStarted = false;
    this.#spawnRef = null;
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
   * Register a callback to be run when data from the lsp has been parsed
   * @param {import("../type").LanguageServerOnDataCallback} callback - The callback to run when data has been parsed
   * @returns {import("../type").voidCallback} Callback to remove the listener  callback from being run
   */
  OnData(callback) {
    if (!callback || typeof callback !== "function")
      throw new TypeError("callback must be a function");

    this.#onDataCallbacks.add(callback);

    return () => {
      this.#onDataCallbacks.delete(callback);
    };
  }

  /**
   * Make a request to the process and awit a response
   * @param {import("../type").LanguageServerProtocolMethod} method - The specific method to send
   * @param {any} params - Any shape of params for the request being sent
   * @returns {Promise<any>} The promise to await
   */
  SendRequest(method, params) {
    if (!method || typeof method !== "string")
      throw new TypeError("method must be a non-empty string");

    if (params !== undefined && params !== null && typeof params !== "object")
      throw new TypeError("params must be an object, null, or undefined");

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
      logger.error(
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
   * Parses the stdout and notifys intrested parties of the message parsed
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

      try {
        const response = JSON.parse(messageBody);
        this.#notify(response);
      } catch (err) {
        logger.error(
          `Failed to parse response for command: ${this.#command} ${JSON.stringify(err)}`,
        );
        logger.error("Raw body " + messageBody);
      }

      this.#stdoutBuffer = this.#stdoutBuffer.subarray(messageEnd);
    }
  }

  /**
   * Notifys on listener  that a message has been parsed fromn the lsp
   * @param {import("vscode-languageserver-protocol").ResponseMessage} response
   * @returns {void}
   */
  #notify(response) {
    if (!response || typeof response !== "object")
      throw new TypeError("response must be an object");

    if (
      response.id !== null &&
      this.#pendingRequests.has(Number(response.id))
    ) {
      const obj = this.#pendingRequests.get(Number(response.id));

      if (response.error) {
        obj?.reject(response.error);
      } else {
        obj?.resolve(response.result);
      }

      this.#pendingRequests.delete(Number(response.id));
    }

    this.#onDataCallbacks.forEach((cb) => cb(response));
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
      logger.error(
        `Failed to write to stdin stream of command: ${this.#command} error: ${JSON.stringify(error)}`,
      );

      throw error;
    }
  }
}

module.exports = { JsonRpcProcess };
