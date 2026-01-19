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

  SendRequest() {}

  /**
   * Clears any pending requests to stop hanging
   */
  #rejectPendingRequests() {}

  /**
   * Attempts to parse the stdout buffer and then handle any messages parsed
   */
  #parseStdout() {}

  /**
   * Given a parsed stdout message to notify those intrested and pass the content along where needed
   */
  #handle() {}
}
