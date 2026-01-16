const { spawn } = require("child_process");
const { logger } = require("../logger");

/**
 * Used as a generic way to interact with a JSONRpc compliant LSP
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
   * Required for spawn of the LSP
   * @param {string} command - The command to spawn the LSP such as `gopls` or the path to the binary
   * @param {string[]} args - Any addtional arguments to pass to the command on spawn such as `["--stdio"]`
   */
  constructor(command, args = []) {
    this.#command = command;
    this.#args = args;
  }

  Start() {
    try {
      if (this.#isStarted) {
        logger.info("JSON Rpc already started for command " + this.#command);
        return;
      }
      if (!this.#command) throw new Error("Command not passed");
      this.#spawnRef = spawn(this.#command, this.#args);
    } catch (error) {
      logger.error(
        "Failed to start JSON RPC process with command " +
          this.#command +
          " error: " +
          JSON.stringify(error),
      );
    }
  }

  /**
   * Make a request to the process and awit a response
   * @param {import("../type").LanguageServerProtocolMethod} method - The specific method to send
   * @param {any} params - Any shape of params for the request being sent
   * @returns {Promise<boolean>} The promise to await
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
            this.#pendingRequests.get(requestId)?.reject();
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
