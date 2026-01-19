/**
 * @typedef {import("../type").languageId} languageId
 */

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

    this.#command = command;
    this.#workSpaceFolder = workSpaceFolder;
    this.#languageId = languageId;
    this.#getMainWindow = getMainWindow;
  }

  Start() {}

  Stop() {}

  SendRequest() {}
}
