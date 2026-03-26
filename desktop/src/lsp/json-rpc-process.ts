import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import fs from "fs/promises";
import path from "path";
import type { languageId, LanguageServerProtocolMethod } from "../type.js";
import { logger } from "../logger.js";
import { assertUri, isUri } from "./uri.js";
import { broadcastToAll } from "../broadcast.js";
import type {
  DidChangeTextDocumentParams,
  DidCloseTextDocumentParams,
  DidOpenTextDocumentParams,
  NotificationMessage,
  RequestMessage,
  ResponseMessage,
  TextDocumentContentChangeEvent,
} from "vscode-languageserver-protocol";
import {
  assertArray,
  assertNonNegativeNumber,
  assertObject,
  assertString,
  assertStringArray,
} from "../assert.js";

/**
 * Type guard that checks whether an unknown value is a valid {@link ResponseMessage}.
 *
 * A value qualifies as a `ResponseMessage` if it satisfies all of the following:
 * - Is a non-null object
 * - Has a `jsonrpc` property equal to `"2.0"`
 * - Has an `id` property that is a number, string, or `null`
 * - Has either a `result` property (on success) or an `error` property (on failure), but not both
 *
 * @param value - The value to test.
 * @returns `true` if `value` is a {@link ResponseMessage}, narrowing its type accordingly.
 *
 * @example
 * const raw = JSON.parse(line);
 * if (isResponseMessage(raw)) {
 *   // raw is now typed as ResponseMessage
 *   console.log(raw.id, raw.result);
 * }
 */
function isResponseMessage(value: unknown): value is ResponseMessage {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  // Must be a JSON-RPC 2.0 message
  if (record["jsonrpc"] !== "2.0") {
    return false;
  }

  // id must be a number, string, or null — undefined is not allowed
  const id = record["id"];
  if (typeof id !== "number" && typeof id !== "string" && id !== null) {
    return false;
  }

  const hasResult = "result" in record;
  const hasError = "error" in record;

  // A response must carry either a result or an error, but never both
  if (!hasResult && !hasError) {
    return false;
  }

  if (hasResult && hasError) {
    return false;
  }

  return true;
}

function isNotificationMessage(obj: unknown): obj is NotificationMessage {
  if (typeof obj !== "object" || obj === null) return false;
  const record = obj as Record<string, unknown>;
  const method = typeof record["method"];
  if (method !== "string") return false;
  if (
    record["params"] !== undefined &&
    !Array.isArray(record["params"]) &&
    typeof record["params"] !== "object"
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
   * Holds the pending requests made to the process.
   *
   * Each entry in the map corresponds to a request ID and its associated handlers.
   */
  private _pendingRequests: Map<
    number,
    {
      resolve: (value: ResponseMessage["result"]) => void;
      reject: (reason?: unknown) => void;
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
   * @param  command - The command to spawn the LSP such as `gopls` or the path to the binary
   * @param  args - Any addtional arguments to pass to the command on spawn such as `["--stdio"]`
   * @param  workSpaceFolder - The workspace this is for exmaple `c:/dev/some/project/`
   * @param  languageId - The specific language this is for exmaple `go` or `js` etc
   */
  constructor(
    command: string,
    args: string[],
    workSpaceFolder: string,
    languageId: languageId,
  ) {
    assertString(command);
    assertStringArray(args);
    assertString(workSpaceFolder);
    assertString(languageId);

    this._command = command;
    this._args = args;
    this._workSpaceFolder = path.normalize(workSpaceFolder);
    this._languageId = languageId;
  }

  /**
   * Clears up pendinbg promises
   */
  private _rejectPendingRequests(error: Error) {
    this._pendingRequests.forEach(({ reject }) => {
      reject(new Error(`Process error: ${error.message}`));
    });
    this._pendingRequests.clear();
  }

  /**
   * Assert that the process ir running
   */
  private assertIsStarted() {
    if (!this.IsStarted()) {
      logger.error("Process not started ", this._createInfoDumpObject());
      throw new Error("Process not started");
    }
  }

  /**
   * Creates a info object about the given process
   * @returns Object containg information about the given process
   */
  private _createInfoDumpObject() {
    return {
      command: this._command,
      args: this._args,
      workSpaceFolder: this._workSpaceFolder,
      languageId: this._languageId,
    };
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

      const contentLength = parseInt(contentLengthMatch[1], 10);
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

      let response: ResponseMessage | null = null;
      try {
        response = JSON.parse(messageBody) as ResponseMessage;
      } catch (err) {
        logger.error(
          "Failed to parse stdout message ",
          this._createInfoDumpObject(),
          messageBody,
          err,
        );
        continue;
      }

      try {
        this._handle(response);
      } catch (err) {
        logger.error(
          "Failed to notify message ",
          this._createInfoDumpObject(),
          err,
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
  private _resolvePendingRequests(responseMessage: ResponseMessage): void {
    if (!isResponseMessage(responseMessage)) {
      return;
    }

    if (!responseMessage["id"]) {
      return;
    }

    const requestId = Number(responseMessage.id);
    if (!this._pendingRequests.has(requestId)) {
      return;
    }

    const obj = this._pendingRequests.get(requestId);
    if (!obj) {
      throw new Error("Pending requests object is null");
    }

    if (responseMessage.error) {
      clearTimeout(obj.timeout);
      obj.reject(responseMessage.error);
    } else {
      clearTimeout(obj.timeout);
      obj.resolve(responseMessage.result);
    }

    this._pendingRequests.delete(requestId);
  }

  /**
   * Handles a response message from the LSP and notifies any listeners
   * @param {ResponseMessage} response
   */
  private _handle(response: ResponseMessage) {
    this._resolvePendingRequests(response);

    const languageId = this._languageId as languageId;
    assertString(languageId);
    const workSpaceFolder = this._workSpaceFolder as string;
    assertString(workSpaceFolder);

    broadcastToAll("lsp:data", response, languageId, workSpaceFolder);

    if (isNotificationMessage(response)) {
      this._handleNotificationMessage(response);
    }
  }

  /**
   * Notify interested parties of a notification message from the LSP
   */
  private _handleNotificationMessage(notification: NotificationMessage): void {
    const languageId = this._languageId as languageId;
    assertString(languageId);
    const workSpaceFolder = this._workSpaceFolder as string;
    assertString(workSpaceFolder);

    broadcastToAll(
      "lsp:notification",
      notification,
      languageId,
      workSpaceFolder,
    );
  }

  /**
   * Write a request to the stdin stream of the process
   * @param message The message
   */
  private _writeToStdin(message: RequestMessage) {
    assertObject(message);
    this.assertIsStarted();

    if (!this._spawnRef) {
      logger.error("Process does not exist ", this._createInfoDumpObject());
      throw new Error("Trying to write to child process but it is undefined");
    }

    if (!this._spawnRef.stdin.writable) {
      logger.error("Cannot write to process ", this._createInfoDumpObject());
      throw new Error(
        "Trying to write to child process but stdin is not writable",
      );
    }

    try {
      const json = JSON.stringify(message);
      const contentLength = Buffer.byteLength(json, "utf8");
      const writeContent = `Content-Length: ${String(contentLength)}\r\n\r\n${json}`;

      this._spawnRef.stdin.write(writeContent);
    } catch (error) {
      logger.error(
        "Failed to write to stdin stream of process ",
        this._createInfoDumpObject(),
        error,
      );

      throw error;
    }
  }

  /**
   * Get the PID number of the process
   * @returns {number | undefined}
   */
  public GetPid(): number | undefined {
    return this._pid;
  }

  /**
   * Get the command spawned for a given the given process
   * @returns {string | null}
   */
  public GetCommand(): string | null {
    return this._command;
  }

  /**
   * Check if the process is running
   * @returns {boolean} If it is or is not
   */
  public IsStarted(): boolean {
    if (this._isStarted && this._spawnRef !== null && !this._spawnRef.killed) {
      return true;
    }

    return false;
  }

  /**
   * Start the process
   */
  public async Start(): Promise<void> {
    try {
      if (this.IsStarted()) {
        logger.info(`Process already running `, this._createInfoDumpObject());
        return;
      }

      const workspaceFolder = this._workSpaceFolder as string;
      assertString(workspaceFolder);
      const command = this._command as string;
      assertString(command);

      await fs.access(workspaceFolder);

      this._spawnRef = spawn(command, this._args);

      this._pid = this._spawnRef.pid;

      this._spawnRef.stdout.on("data", (chunk) => {
        this._stdoutBuffer = Buffer.concat([this._stdoutBuffer, chunk]);
        this._parseStdout();
      });

      this._spawnRef.stderr.on("data", (chunk) => {
        logger.error(`LSP stderr: ${chunk.toString()}`);
      });

      this._spawnRef.on("error", (error) => {
        logger.error("Process error ", this._createInfoDumpObject(), error);
        this._rejectPendingRequests(error);
      });

      this._spawnRef.on("exit", (code, signal) => {
        logger.info(
          "Process exited ",
          this._createInfoDumpObject(),
          code,
          signal,
        );
        if (code !== 0) {
          this._rejectPendingRequests(
            new Error("Process exited with non zero code"),
          );
        }
      });

      this._isStarted = true;
    } catch (error) {
      logger.error(
        "Failed to start process ",
        this._createInfoDumpObject(),
        error,
      );

      throw error;
    }
  }

  /**
   * Shutdown the process and cleanup resources - not the same as stop - this is like a extreme cleanup at the very end
   * @returns {void}
   */
  public Shutdown(): void {
    this._isStarted = false;

    if (this._spawnRef && !this._spawnRef.killed) {
      this._spawnRef.kill("SIGTERM");

      setTimeout(() => {
        if (this._spawnRef && !this._spawnRef.killed) {
          this._spawnRef.kill("SIGKILL");
          this._spawnRef = null;
        }
      }, 1000);
    }

    this._rejectPendingRequests(new Error("Process shutting down"));
  }

  /**
   * Write exit request - call after `shutdown request`
   */
  public Exit() {
    this.assertIsStarted();

    this._writeToStdin({
      jsonrpc: "2.0",
      method: "exit",
      id: null,
    });
  }

  /**
   * Call after making a initlized  request
   */
  public Initialized() {
    this.assertIsStarted();

    this._writeToStdin({
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
  public SendRequest<T>(
    method: LanguageServerProtocolMethod,
    params: unknown,
  ): Promise<T> {
    assertString(method);
    this.assertIsStarted();

    try {
      const requestId = this._getId();

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          const pendingRequest = this._pendingRequests.get(requestId);
          if (pendingRequest) {
            pendingRequest.reject(new Error("Request timed out"));
            this._pendingRequests.delete(requestId);
          }
        }, 4500);

        this._pendingRequests.set(requestId, {
          resolve,
          reject,
          timeout,
        });

        this._writeToStdin({
          id: requestId,
          jsonrpc: "2.0",
          method,
          params: params as object,
        });
      });
    } catch (error) {
      logger.error(
        "Failed to send request ",
        this._createInfoDumpObject(),
        error,
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
  public DidOpenTextDocument(
    uri: string,
    languageId: string,
    version: number,
    text: string,
  ): void {
    this.assertIsStarted();
    assertString(uri);
    assertUri(uri);
    assertString(languageId);
    assertNonNegativeNumber(version);
    assertString(text);

    const method: LanguageServerProtocolMethod = "textDocument/didOpen";
    const params: DidOpenTextDocumentParams = {
      textDocument: {
        uri: uri,
        languageId: languageId,
        version: version,
        text: text,
      },
    };

    this._writeToStdin({
      jsonrpc: "2.0",
      method: method,
      params: params,
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
  public DidChangeTextDocument(
    uri: string,
    version: number,
    contentChanges: TextDocumentContentChangeEvent[],
  ): void {
    this.assertIsStarted();
    assertString(uri);
    assertUri(uri);
    assertNonNegativeNumber(version);
    assertArray(contentChanges);

    const method: LanguageServerProtocolMethod = "textDocument/didChange";
    const params: DidChangeTextDocumentParams = {
      textDocument: {
        uri: uri,
        version: version,
      },
      contentChanges: contentChanges,
    };

    this._writeToStdin({
      jsonrpc: "2.0",
      method: method,
      params: params,
      id: null,
    });
  }

  /**
   * Send a textDocument/didClose notification to the LSP
   * @param {string} uri - The document URI (e.g., "file:///path/to/file.go")
   * @returns {void}
   */
  public DidCloseTextDocument(uri: string): void {
    this.assertIsStarted();
    assertString(uri);
    assertUri(uri);

    const method: LanguageServerProtocolMethod = "textDocument/didClose";
    const params: DidCloseTextDocumentParams = {
      textDocument: {
        uri: uri,
      },
    };

    this._writeToStdin({
      jsonrpc: "2.0",
      method: method,
      params: params,
      id: null,
    });
  }
}
