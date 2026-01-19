/**
 * @typedef {import("../type").languageId} languageId
 */

const { spawn } = require("child_process");
const { logError, logger } = require("../logger");
const path = require("path");

/**
 * @typedef {import("../type").getMainWindow} getMainWindow
 */

/**
 * Used to spawn and manage the typescript process offering the LSP protocol to interact with it as typescript has a custom protocol.
 *
 * @see https://github.com/microsoft/TypeScript/wiki/Standalone-Server-(tsserver)
 */
class TypeScriptProcess {
  /**
   * The specific command used to spawn the process such as either path to a exe or a command itself like `gopls`
   * @type {string}
   */
  #command;

  /**
   * The folder this process was spawned for example `c:/dev/some/project`
   * @type {string}
   */
  #workSpaceFolder;

  /**
   * The specific language this is for example `go` or `typescript` etc
   * @type {languageId}
   */
  #languageId;

  /**
   * Used to fetch the main window
   * @type {getMainWindow}
   */
  #getMainWindow;

  /**
   * Refrence to the main window - used to send events
   * @type {import("electron").BrowserWindow | null}
   */
  #mainWindowRef = null;

  /**
   * Indicates if the process is running - stops it spawing multiple
   * @type {boolean}
   */
  #isStarted = false;

  /**
   * Ref to the process spawned using the command
   * @type {import("child_process").ChildProcessWithoutNullStreams  | null}
   */
  #spawnRef = null;

  /**
   * Holds the list of arguments passed to the command on spawn
   * @type {string[]}
   */
  #args = [];

  /**
   * Holds the output produced by the stdout process
   * @type {Buffer}
   */
  #stdoutBuffer = Buffer.alloc(0);

  /** Holds the next request number */
  #seqId = 0;

  /** Get the next request number */
  #getNextSeq = () => this.#seqId++;

  /**
   * Contains a map of specific request Id's and there promises that need to be resolved for there requests
   *
   * - `Key` - The specific request id
   * - `Value` - Resolvers for the promise it is for
   * @type {Map<number, {resolve: (value: any) => void, reject: (reason?: any) => void}>}
   */
  #pendingRequests = new Map();

  /**
   * Required to spawn and manage the typescript process
   * @param {string} command - Used to spawn the process can either be a path to a exe or somthing like a command
   * @param {string[]} args - Arguments to pass on spawn such as ["--stdio"] etc
   * @param {string} workSpaceFolder - Path to the folder this is for for example `c:/dev/some/project`
   * @param {languageId} languageId - The specific language ID to identify it between layers such as `typescript`
   * @param {getMainWindow} getMainWindow
   */
  constructor(command, args, workSpaceFolder, languageId, getMainWindow) {
    if (typeof command !== "string" || command.trim().length === 0)
      throw new TypeError("command must be a non empty string");

    if (!Array.isArray(args) || !args.every((x) => typeof x === "string"))
      throw new TypeError("args must be an array of strings");

    if (
      typeof workSpaceFolder !== "string" ||
      workSpaceFolder.trim().length === 0
    )
      throw new TypeError("workSpaceFolder must be a non empty string");

    if (typeof languageId !== "string" || languageId.trim().length === 0)
      throw new TypeError("languageId must be a non empty string");

    if (typeof getMainWindow !== "function")
      throw new TypeError("getMainWindow must be a function");

    this.#command = path.normalize(path.resolve(command));
    this.#workSpaceFolder = path.normalize(path.resolve(workSpaceFolder));
    this.#languageId = languageId;
    this.#getMainWindow = getMainWindow;
    this.#args = args;
  }

  /**
   * Starts the process for the workspace folder provided and other options provided
   * @returns {void} Nothing
   */
  Start() {
    try {
      if (this.#isStarted) {
        logger.warn(
          `Typescript process already started for command: ${this.#command} workspace folder: ${this.#workSpaceFolder} language: ${this.#languageId}`,
        );
        return;
      }

      this.#spawnRef = spawn(this.#command, this.#args, {
        cwd: this.#workSpaceFolder,
      });

      this.#spawnRef.stdout.on("data", (chunk) => {
        this.#stdoutBuffer = Buffer.concat([this.#stdoutBuffer, chunk]);
        this.#parseStdout();
      });

      this.#spawnRef.stderr.on("data", (chunk) => {
        logger.error(
          `Typescript process for command: ${this.#command} workspace folder: ${this.#workSpaceFolder} language: ${this.#languageId} produced a error`,
        );
        logger.error(chunk.toString());
      });

      this.#spawnRef.on("error", () => {
        this.#rejectPendingRequests();
      });

      this.#spawnRef.on("close", () => {
        this.#rejectPendingRequests();
      });

      this.#spawnRef.on("disconnect", () => {
        this.#rejectPendingRequests();
      });

      this.#spawnRef.on("exit", () => {
        this.#rejectPendingRequests();
      });

      this.#isStarted = true;
    } catch (error) {
      logError(
        error,
        `Failed to start typescript process for command: ${this.#command} workspace folder: ${this.#workSpaceFolder} language: ${this.#languageId}`,
      );
      throw error;
    }
  }

  /**
   * Make a request and await typescript server response and recieve it.
   * @param {import("typescript").server.protocol.CommandTypes} command - The specific command to make a request
   * @param {any} params - any addtional params it needed
   * @returns {Promise<any>} Promise that resolves to the parsed content of the command or rejects
   */
  SendRequest(command, params) {
    try {
      const requestId = this.#getNextSeq();
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          if (this.#pendingRequests.has(requestId)) {
            this.#pendingRequests
              .get(requestId)
              ?.reject(new Error(`Request id: ${requestId} timed out`));
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
      });
    } catch (error) {
      logError(
        error,
        `Failed to send typescript server request. Request command: ${command} request params: ${JSON.stringify(params)}`,
      );

      throw error;
    }
  }

  /**
   * Clears any pending requests to stop hanging
   */
  #rejectPendingRequests() {}

  /**
   * Attempts to parse the stdout buffer and then handle any messages parsed
   */
  #parseStdout() {
    let bufferString = this.#stdoutBuffer.toString("utf-8");

    while (true) {
      const headerMatch = bufferString.match(/Content-Length: (\d+)\r?\n\r?\n/);

      if (!headerMatch || headerMatch.index === undefined) {
        break;
      }

      const contentLength = parseInt(headerMatch[1], 10);
      const headerEndIndex = headerMatch.index + headerMatch[0].length;

      if (bufferString.length < headerEndIndex + contentLength) {
        break;
      }

      const messageBody = bufferString.substring(
        headerEndIndex,
        headerEndIndex + contentLength,
      );

      try {
        const message = JSON.parse(messageBody);
        this.#handle(message);
      } catch (error) {
        logError(
          error,
          `Failed to parse TSServer message for command: ${this.#command} workspace folder: ${this.#workSpaceFolder} language: ${this.#languageId}`,
        );
        logger.error(`Raw message body: ${messageBody}`);
      }

      bufferString = bufferString.substring(headerEndIndex + contentLength);
    }

    this.#stdoutBuffer = Buffer.from(bufferString, "utf-8");
  }

  /**
   * Given a parsed stdout message to notify those intrested and pass the content along where needed
   * @param {any} message - MEssage parsed from typescript server
   */
  #handle(message) {
    console.log(message);
  }

  /**
   * Attempt to write to the stdin of the spawned command
   * @param {import("typescript").server.protocol.Request} message - The message to send
   * @returns {void} Nothing
   */
  #writeToStdin(message) {
    if (typeof message !== "object")
      throw new TypeError("message must be a object");

    if (!this.#spawnRef)
      throw new Error("Cannot write to stdin as process not yet started");

    if (!this.#spawnRef.stdin.writable)
      throw new Error("Cannot write to stdin of process");

    try {
      const payload = JSON.stringify(message) + "\n";
      this.#spawnRef.stdin.write(payload, "utf8");
    } catch (error) {
      logError(
        error,
        `Failed to write to stdin of process command: ${this.#command} workspace folder: ${this.#workSpaceFolder} language: ${this.#languageId}`,
      );
      logger.error(`Raw body ${JSON.stringify(message)}`);
      throw error;
    }
  }
}
