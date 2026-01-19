const { logger, logError } = require("../../logger");
const { getTypescriptServerPath } = require("../../packing");
const path = require("path");
const { TypeScriptProcess } = require("../typescript-process");
const cmds = require("typescript").server.protocol.CommandTypes;

/**
 * @typedef {import("../../type").ILanguageServer} ILanguageServer
 */

/**
 * The typescript language server implementation using following json RPC protocol design
 */
class TypeScriptLanguageServer {
  /**
   * Fetches the main window
   * @type {import("../../type").getMainWindow | null}
   */
  #getMainWindow = null;

  /**
   * The specific language id for exmaple `typescript`
   * @type {import("../../type").languageId | null}
   */
  #languageId = null;

  /**
   * Reference to the main window
   * @type {import("electron").BrowserWindow | null}
   */
  #mainWindowRef = null;

  /**
   * Required for typescript LSP to work
   * @param {import("../../type").getMainWindow} getMainWindow - Used to fetch the main window
   * @param {import("../../type").languageId} languageId - The specific language id for exmaple `typescript`
   */
  constructor(getMainWindow, languageId) {
    if (typeof getMainWindow !== "function")
      throw new Error("getMainWindow must be a function");

    if (typeof languageId !== "string" || languageId.trim() === "")
      throw new Error("languageId must be a non-empty string");

    this.#getMainWindow = getMainWindow;
    this.#languageId = languageId;
    this.#mainWindowRef = this.#getMainWindow(); // we do this because we don't know when the main window will be available
  }

  /**
   * Holds a map of workspace and it's process running for it
   * @type {Map<string, import("../typescript-process").TypeScriptProcess>}
   */
  #workSpaceProcessMap = new Map();

  /**
   * @type {import("../../type").ILanguageServerStart}
   */
  async Start(workSpaceFolder) {
    if (typeof workSpaceFolder !== "string" || workSpaceFolder.trim() === "")
      throw new Error("workSpaceFolder must be a non-empty string");

    if (typeof this.#getMainWindow !== "function")
      throw new Error("getMainWindow must be a function");

    if (typeof this.#languageId !== "string" || this.#languageId.trim() === "")
      throw new Error("languageId must be a non-empty string");

    this.#mainWindowRef = this.#getMainWindow();

    if (typeof this.#mainWindowRef !== "object" || this.#mainWindowRef === null)
      throw new Error("mainWindowRef must be a valid BrowserWindow");

    try {
      let exePath = getTypescriptServerPath();
      if (!exePath) {
        throw new Error("No typescript exe path");
      }

      const _workSpaceFolder = path.normalize(path.resolve(workSpaceFolder));

      if (this.#workSpaceProcessMap.has(_workSpaceFolder)) {
        logger.warn(
          `Typescript server already started for workspace: ${_workSpaceFolder}`,
        );
        return true;
      }

      const rc = new TypeScriptProcess(
        "node", // we use node to run the typescript server because it's a js file
        [exePath],
        _workSpaceFolder,
        this.#languageId,
        this.#getMainWindow,
      );

      this.#workSpaceProcessMap.set(_workSpaceFolder, rc);

      rc.Start(); // we don't need to send a json rpc initialization here because the typescript server doesn't require it

      logger.info(`Started typescript lsp for workspace: ${workSpaceFolder}`);

      return true;
    } catch (error) {
      logError(
        error,
        `Failed to start typescript lsp for workspace: ${workSpaceFolder}`,
      );

      this.#workSpaceProcessMap.delete(
        path.normalize(path.resolve(workSpaceFolder)),
      );

      throw error;
    }
  }

  /**
   * @type {import("../../type").ILanguageServerStop}
   */
  async Stop(workSpaceFolder) {
    if (typeof workSpaceFolder !== "string" || workSpaceFolder.trim() === "")
      throw new Error("workSpaceFolder must be a non-empty string");

    const _workSpaceFolder = path.normalize(path.resolve(workSpaceFolder));

    try {
      if (!this.#workSpaceProcessMap.has(_workSpaceFolder)) {
        logger.warn(
          `Typescript server not running for workspace: ${_workSpaceFolder}`,
        );
        return true;
      }

      const process = this.#workSpaceProcessMap.get(_workSpaceFolder);
      if (!process) {
        this.#workSpaceProcessMap.delete(_workSpaceFolder);
        logger.warn(
          `Typescript server process reference missing for workspace: ${_workSpaceFolder}`,
        );
        return true;
      }

      await process.SendRequest(cmds.Exit, {}, { expectResponse: false });

      this.#workSpaceProcessMap.delete(_workSpaceFolder);

      logger.info(`Stopped typescript lsp for workspace: ${_workSpaceFolder}`);

      return true;
    } catch (error) {
      logError(
        error,
        `Failed to stop typescript lsp for workspace: ${_workSpaceFolder}`,
      );

      throw error;
    }
  }

  Completion() {
    throw new Error("Not implemented");
  }

  DidChangeTextDocument() {
    throw new Error("Not implemented");
  }

  DidCloseTextDocument() {
    throw new Error("Not implemented");
  }

  DidOpenTextDocument() {
    throw new Error("Not implemented");
  }

  GetWorkspaceFolders() {
    throw new Error("Not implemented");
  }

  Hover() {
    throw new Error("Not implemented");
  }
}

/**
 * Simple test to start and stop the TypeScript Language Server
 */
// async function testTypeScriptLanguageServer() {
//   console.log("Starting TypeScript Language Server test...\n");

//   // Mock main window getter
//   const mockMainWindow = {
//     webContents: {
//       send: (channel, data) => {
//         console.log(`[Mock Window] Sent to channel: ${channel}`, data);
//       },
//     },
//   };

//   const getMainWindow = () => mockMainWindow;
//   const languageId = "typescript";
//   const workspaceFolder = path.join("C:\\dev\\fluf\\desktop"); // Change this to your test workspace

//   try {
//     // Create the language server instance
//     const lsp = new TypeScriptLanguageServer(getMainWindow, languageId);
//     console.log("✓ TypeScript Language Server instance created\n");

//     // Start the server
//     console.log(`Starting server for workspace: ${workspaceFolder}`);
//     const startResult = await lsp.Start(workspaceFolder);
//     console.log(`✓ Server started successfully: ${startResult}\n`);

//     // Wait for some time (5 seconds)
//     console.log("Waiting 5 seconds before stopping...");
//     await new Promise((resolve) => setTimeout(resolve, 5000));

//     // Stop the server
//     console.log(`\nStopping server for workspace: ${workspaceFolder}`);
//     const stopResult = await lsp.Stop(workspaceFolder);
//     console.log(`✓ Server stopped successfully: ${stopResult}\n`);

//     console.log("Test completed successfully! ✓");
//   } catch (error) {
//     console.error("✗ Test failed with error:", error);
//     process.exit(1);
//   }
// }

// testTypeScriptLanguageServer();

module.exports = {
  TypeScriptLanguageServer,
};
