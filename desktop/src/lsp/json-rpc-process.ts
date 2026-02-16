import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import fs from "fs/promises";
import path from "path";
import type {
  languageId,
  LanguageServerNotificationResponse,
  LanguageServerProtocolMethod,
} from "../type.js";
import { logger } from "../logger.js";
import { isUri } from "./uri.js";
import { broadcastToAll } from "../broadcast.js";
import type {
  NotificationMessage,
  ResponseMessage,
} from "vscode-languageserver-protocol";

/**
 * Type guard to check if an object is a NotificationMessage
 */
function isNotificationMessage(obj: any): obj is NotificationMessage {
  if (typeof obj !== "object" || obj === null) return false;
  if (typeof obj.method !== "string") return false;
  if (
    obj.params !== undefined &&
    !Array.isArray(obj.params) &&
    typeof obj.params !== "object"
  )
    return false;
  return true;
}

/**
 * Used as a generic way to interact with a JSONRpc compliant LSP process that is spawned with the command combined with electron event sending,
 * this is done as electron `preload.js` cannot accept callbacks as params so we need to attach them in the `preload.js` file then send events to run said callbacks that where
 * attached in the `preload.js` file.
 *
 * @see https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/
 */
export class JsonRpcProcess {
  /**
   * Command used to spawn the LSP
   * @type {string | null}
   */
  private _command: string | null = null;

  /**
   * Get the command spawned for a given the given process
   * @returns {string | null}
   */
  GetCommand(): string | null {
    return this._command;
  }

  /**
   * Aguments passed on spawn
   * @type {string[]}
   */
  private _args: string[] = [];

  /**
   * The spawned child process
   * @type {ChildProcessWithoutNullStreams | null}
   */
  private _spawnRef: ChildProcessWithoutNullStreams | null = null;

  /**
   * Indicates if the process has been started
   */
  private _isStarted = false;

  /**
   * Check if the process is running
   * @returns {boolean} If it is or is not
   */
  IsStarted(): boolean {
    return this._isStarted;
  }

  /**
   * Holds the pending requests made to the process.
   *
   * Each entry in the map corresponds to a request ID and its associated handlers.
   */
  private _pendingRequests: Map<
    number,
    {
      resolve: (value: ResponseMessage["result"]) => void;
      reject: (reason?: any) => void;
      timeout: NodeJS.Timeout;
    }
  > = new Map();

  /** Holds the next ID  */
  private _id = 0;
  /**
   * Gets the next id
   * @returns {number} - The next id
   */
  private _getId(): number {
    return this._id++;
  }

  /**
   * Holds the buffer data sent out from the stdin stream from the spawned cmd
   * @type {Buffer}
   */
  private _stdoutBuffer: Buffer = Buffer.alloc(0);

  /**
   * Holds the PID number of the spawend process
   * @type {number | undefined}
   */
  private _pid: number | undefined = undefined;

  /**
   * Get the PID number of the process
   * @returns {number | undefined}
   */
  GetPid(): number | undefined {
    return this._pid;
  }

  /**
   * Holds the workspace folder this was spawned for for exmaple `c:/dev/some/project`
   * @type {string | null}
   */
  private _workSpaceFolder: string | null = null;

  /**
   * Holds the language this is for exmaple `go` or `js` etc
   * @type {languageId | null}
   */
  private _languageId: languageId | null = null;

  /**
   * Required for spawn of the process to work and properly spawn and communicate as needed
   * @param {string} command - The command to spawn the LSP such as `gopls` or the path to the binary
   * @param {string[]} args - Any addtional arguments to pass to the command on spawn such as `["--stdio"]`
   * @param {string} workSpaceFolder - The workspace this is for exmaple `c:/dev/some/project/`
   * @param {languageId | null} languageId - The specific language this is for exmaple `go` or `js` etc
   */
  constructor(
    command: string,
    args: string[],
    workSpaceFolder: string,
    languageId: languageId | null,
  ) {
    if (!command || typeof command !== "string")
      throw new TypeError("command must be a non-empty string");

    if (!Array.isArray(args)) throw new TypeError("args must be an array");

    if (!args.every((arg) => typeof arg === "string"))
      throw new TypeError("all elements in args must be strings");

    if (typeof workSpaceFolder !== "string")
      throw new TypeError("workSpaceFolder must be a non empty string");

    if (typeof languageId !== "string")
      throw new TypeError("languageId must be a non empty string");

    this._command = command;
    this._args = args;
    this._workSpaceFolder = path.normalize(workSpaceFolder);
    this._languageId = languageId;
  }

  /**
   * Start the process
   */
  async Start() {
    if (!this._workSpaceFolder || this._workSpaceFolder.length === 0)
      throw new TypeError("workSpaceFolder must be a non empty string");

    if (!this._command) throw new Error("Command not passed");

    try {
      if (this._isStarted) {
        logger.info(`JSON Rpc already started for command ${this._command}`);
        return;
      }

      await fs.access(this._workSpaceFolder);

      this._spawnRef = spawn(this._command, this._args);

      this._pid = this._spawnRef.pid;

      this._spawnRef.stdout.on("data", (chunk) => {
        this._stdoutBuffer = Buffer.concat([this._stdoutBuffer, chunk]);
        this._parseStdout();
      });

      this._spawnRef.stderr.on("data", (chunk) => {
        logger.error(`LSP stderr: ${chunk.toString()}`);
      });

      this._spawnRef.on("error", (error) => {
        logger.error(`Process error for ${this._command}: ${error.message}`);
        this._isStarted = false;
        this._pendingRequests.forEach(({ reject }) => {
          reject(new Error(`Process error: ${error.message}`));
        });
        this._pendingRequests.clear();
      });

      this._spawnRef.on("exit", (code, signal) => {
        logger.info(
          `Process ${this._command} exited with code ${code}, signal ${signal}`,
        );
        this._isStarted = false;
        this._pendingRequests.forEach(({ reject }) => {
          reject(new Error(`Process exited with code ${code}`));
        });
        this._pendingRequests.clear();
      });

      this._isStarted = true;
    } catch (error) {
      this._isStarted = false;

      logger.error(
        error,
        `Failed to start JSON RPC process with command ${this._command}`,
      );

      throw error;
    }
  }

  /**
   * Shutdown the process and cleanup resources - not the same as stop - this is like a extreme cleanup at the very end
   * @returns {void}
   */
  Shutdown(): void {
    this._isStarted = false;

    if (this._spawnRef && !this._spawnRef.killed) {
      this._spawnRef.kill("SIGTERM");

      setTimeout(() => {
        if (this._spawnRef && !this._spawnRef.killed) {
          this._spawnRef.kill("SIGKILL");
        }
      }, 1000);
    }

    this._pendingRequests.forEach(({ reject }) => {
      reject(new Error("Process shutdown"));
    });

    this._pendingRequests.clear();
    this._spawnRef = null;
  }

  /**
   * Write exit request - call after `shutdown request`
   */
  Exit() {
    this._write({
      jsonrpc: "2.0",
      method: "exit",
      id: null,
    });
  }

  /**
   * Call after making a initlized  request
   */
  Initialized() {
    this._write({
      jsonrpc: "2.0",
      method: "initialized",
      params: {},
      id: null,
    });
  }

  /**
   * Make a request to the process and await a response
   * @param {LanguageServerProtocolMethod} method - The specific method to send
   * @param {any} params - Any shape of params for the request being sent
   * @returns {Promise<any>} The promise to await and the value from the request parsed or error
   */
  SendRequest(method: LanguageServerProtocolMethod, params: any): Promise<any> {
    if (!method || typeof method !== "string")
      throw new TypeError("method must be a non-empty string");

    if (params !== undefined && params !== null && typeof params !== "object")
      throw new TypeError("params must be an object, null, or undefined");

    if (!this._isStarted) {
      return Promise.reject(
        new Error(`Process not started for command: ${this._command}`),
      );
    }

    try {
      const requestId = this._getId();
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (this._pendingRequests.has(requestId)) {
            this._pendingRequests
              .get(requestId)
              ?.reject(new Error("Request timed out"));
            this._pendingRequests.delete(requestId);
          }
        }, 4500);

        this._pendingRequests.set(requestId, {
          resolve,
          reject,
          timeout,
        });

        this._write({
          id: requestId,
          jsonrpc: "2.0",
          method,
          params,
        });
      });
    } catch (error) {
      logger.error(
        error,
        `Failed to send request for command: ${this._command}`,
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
  DidOpenTextDocument(
    uri: string,
    languageId: string,
    version: number,
    text: string,
  ): void {
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

    this._write({
      jsonrpc: "2.0",
      /** @type {LanguageServerProtocolMethod} */
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
      id: null,
    });
  }

  /**
   * Send a textDocument/didChange notification to the LSP
   * @param {string} uri - The document URI (e.g., "file:///path/to/file.go")
   * @param {number} version - The document version (increments with each change)
   * @param {import("vscode-languageserver-protocol").TextDocumentContentChangeEvent[]} contentChanges - The content changes
   * @returns {void}
   */
  DidChangeTextDocument(
    uri: string,
    version: number,
    contentChanges: import("vscode-languageserver-protocol").TextDocumentContentChangeEvent[],
  ): void {
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

    this._write({
      jsonrpc: "2.0",
      /** @type {LanguageServerProtocolMethod} */
      method: "textDocument/didChange",
      /** @type {import("vscode-languageserver-protocol").DidChangeTextDocumentParams} */
      params: {
        textDocument: {
          uri: uri,
          version: version,
        },
        contentChanges: contentChanges,
      },
      id: null,
    });
  }

  /**
   * Send a textDocument/didClose notification to the LSP
   * @param {string} uri - The document URI (e.g., "file:///path/to/file.go")
   * @returns {void}
   */
  DidCloseTextDocument(uri: string): void {
    if (!uri || typeof uri !== "string")
      throw new TypeError("uri must be a non-empty string");

    if (!isUri(uri)) throw new TypeError("uri must be a valid URI format");

    this._write({
      jsonrpc: "2.0",
      /** @type {LanguageServerProtocolMethod} */
      method: "textDocument/didClose",
      /** @type {import("vscode-languageserver-protocol").DidCloseTextDocumentParams} */
      params: {
        textDocument: {
          uri: uri,
        },
      },
      id: null,
    });
  }

  /**
   * Parses the stdout and notifies interested parties of the message parsed
   */
  private _parseStdout() {
    while (true) {
      const headerEnd = this._stdoutBuffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) {
        return;
      }

      const headers = this._stdoutBuffer
        .subarray(0, headerEnd)
        .toString("utf-8");
      const contentLengthMatch = headers.match(/Content-Length: (\d+)/i);

      if (!contentLengthMatch) {
        logger.error("No Content-Length header found");
        this._stdoutBuffer = this._stdoutBuffer.subarray(headerEnd + 4);
        continue;
      }

      const contentLength = parseInt(contentLengthMatch[1]!, 10);
      const messageStart = headerEnd + 4;
      const messageEnd = messageStart + contentLength;

      if (this._stdoutBuffer.length < messageEnd) {
        return;
      }

      const messageBody = this._stdoutBuffer
        .subarray(messageStart, messageEnd)
        .toString("utf-8");

      // Move buffer advancement BEFORE parsing to prevent infinite loops
      this._stdoutBuffer = this._stdoutBuffer.subarray(messageEnd);

      let response;
      try {
        response = JSON.parse(messageBody);
      } catch (/** @type {any}*/ err: any) {
        logger.error(err, `Failed to parse JSON for command: ${this._command}`);
        logger.error("Raw body: ", messageBody);
        continue;
      }

      try {
        this._handle(response);
      } catch (/** @type {any}*/ err: any) {
        logger.error(
          err,
          `Failed to notify response for command: ${this._command}`,
        );
        // Continue processing even if notification fails
      }
    }
  }

  /**
   * Resolve any pending requests
   * @param {ResponseMessage} responseMessage - The parsed message from the LSP
   * @returns {void} Nothing
   */
  private _resolveRequests(responseMessage: ResponseMessage): void {
    if (responseMessage.id !== null) {
      const requestId = Number(responseMessage.id);
      if (!this._pendingRequests.has(requestId)) {
        return;
      }

      const obj = this._pendingRequests.get(requestId)!;

      if (responseMessage.error) {
        clearTimeout(obj.timeout);
        obj.reject(responseMessage.error);
      } else {
        clearTimeout(obj.timeout);
        obj?.resolve(responseMessage.result);
      }

      this._pendingRequests.delete(requestId);
    }
  }

  /**
   * Handles a response message from the LSP and notifies any listeners
   * @param {import("vscode-languageserver-protocol").ResponseMessage} response
   */
  private _handle(
    response: import("vscode-languageserver-protocol").ResponseMessage,
  ) {
    this._resolveRequests(response);

    broadcastToAll("lsp:data", {
      response: response,
      languageId: this._languageId,
      workSpaceFolder: this._workSpaceFolder,
    });

    if (isNotificationMessage(response)) {
      this._handleNotificationMessage(response);
    }
  }

  /**
   * Notify interested parties of a notification message from the LSP
   * @param {any} notification - The notification message
   * @returns {void} Nothing
   */
  private _handleNotificationMessage(notification: NotificationMessage): void {
    if (!this._languageId) throw new Error("No language id cannot send events");
    if (!this._workSpaceFolder)
      throw new Error("No workspace folder cannot send events");

    broadcastToAll("lsp:notification", {
      method: notification.method,
      params: notification.params,
      languageId: this._languageId,
      workSpaceFolder: this._workSpaceFolder,
    });

    const notificationData: LanguageServerNotificationResponse = {
      languageId: this._languageId,
      workSpaceFolder: this._workSpaceFolder,
      params: notification?.params,
    };

    broadcastToAll(`lsp:notification:${notification.method}`, notificationData);
  }

  /**
   * Write a request to the stdin stream of the process
   * @param {Partial<import("vscode-languageserver-protocol").RequestMessage>} message The message
   */
  private _write(
    message: import("vscode-languageserver-protocol").RequestMessage,
  ) {
    if (!message || typeof message !== "object")
      throw new TypeError("message must be an object");

    if (!this._isStarted) {
      logger.error(
        `Cannot write to process command: ${this._command} as it is not yet started`,
      );
      return;
    }

    if (!this._spawnRef) {
      logger.error(`No child process spawned for command: ${this._command}`);
      throw new Error("Trying to write to child process but it is undefined");
    }

    if (!this._spawnRef.stdin.writable) {
      logger.error(`Cannot write to process command: ${this._command}`);
      throw new Error(
        "Trying to write to child process but stdin is not writable",
      );
    }

    try {
      const json = JSON.stringify(message);
      const contentLength = Buffer.byteLength(json, "utf8");
      const writeContent = `Content-Length: ${contentLength}\r\n\r\n${json}`;
      this._spawnRef.stdin.write(writeContent);
    } catch (error) {
      logger.error(
        `Failed to write to stdin stream of command: ${this._command} error: `,
        error,
      );

      throw error;
    }
  }
}
