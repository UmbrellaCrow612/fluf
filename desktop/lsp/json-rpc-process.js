const { spawn } = require("child_process");
const { logger } = require("../logger");

/**
 * Used as a generic way to interact with a JSONRpc compliant LSP process that is spawned with the command
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
        logger.info("JSON Rpc already started for command " + this.#command);
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

      this.#isStarted = true;
    } catch (error) {
      this.#isStarted = false;

      logger.error(
        "Failed to start JSON RPC process with command " +
          this.#command +
          " error: " +
          JSON.stringify(error),
      );

      throw error;
    }
  }

  /**
   * Shutdown the process and cleanup resources - not the same as stop - this is like a extreme cleanup at the very end
   * @returns {void}
   */
  Shutdown() {
    try {
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
    } catch (error) {
      logger.error("Failed to shutdown rpc process " + JSON.stringify(error));
    }
  }

  /**
   * Call after making a initlized request
   */
  Initialized() {
    this.#write({
      id: null,
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
    try {
      let requestId = this.#getId();
      return new Promise((resolve, reject) => {
        this.#pendingRequests.set(requestId, { resolve, reject });

        this.#write({
          id: requestId,
          jsonrpc: "2.0",
          method,
          params,
        });

        setTimeout(() => {
          if (this.#pendingRequests.has(requestId)) {
            this.#pendingRequests.get(requestId)?.reject("Request timed out");
            this.#pendingRequests.delete(requestId);
          }
        }, 4500);
      });
    } catch (error) {
      logger.error(
        "Failed to send request for command: " +
          this.#command +
          " " +
          JSON.stringify(error),
      );
      return new Promise((_, reject) => {
        reject();
      });
    }
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
          "Failed to parse response for command: " +
            this.#command +
            " " +
            JSON.stringify(err),
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
   * @param {import("vscode-languageserver-protocol").RequestMessage} message The message
   */
  #write(message) {
    if (!this.#isStarted) {
      logger.error(
        "Cannot write to process command: " +
          this.#command +
          " as it is not yet started",
      );
      return;
    }

    if (!this.#spawnRef) {
      console.error("No child process spawned for command: " + this.#command);
      return;
    }

    if (!this.#spawnRef.stdin.writable) {
      console.error("Cannot write to process command: " + this.#command);
      return;
    }

    try {
      const json = JSON.stringify(message);
      const contentLength = Buffer.byteLength(json, "utf8");
      const writeContent = `Content-Length: ${contentLength}\r\n\r\n${json}`;
      this.#spawnRef.stdin.write(writeContent);
    } catch (error) {
      logger.error(
        "Failed to write to stdin stream of command: " +
          this.#command +
          " error: " +
          JSON.stringify(error),
      );
    }
  }
}

module.exports = { JsonRpcProcess };
