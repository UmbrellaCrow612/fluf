import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import path from "path";
import fs from "fs/promises";
import type {
  languageId,
  LanguageServerNotificationResponse,
} from "../type.js";
import { logger } from "../logger.js";
import { broadcastToAll } from "../broadcast.js";
import { createUri } from "./uri.js";

const { protocol } = require("typescript").server;

/**
 * Used to spawn and manage the typescript process offering the LSP protocol to interact with it as typescript has a custom protocol.
 *
 * @see https://github.com/microsoft/TypeScript/wiki/Standalone-Server-(tsserver)
 */
export class TypeScriptProcess {
  /**
   * The specific command used to spawn the process such as either path to a exe or a command itself like `gopls`
   * @type {string | null}
   */
  #command: string | null = null;

  /**
   * The folder this process was spawned for example `c:/dev/some/project`
   * @type {string | null}
   */
  #workSpaceFolder: string | null = null;

  /**
   * The specific language this is for example `go` or `typescript` etc
   * @type {languageId | null}
   */
  #languageId: languageId | null = null;

  /**
   * Indicates if the process is running - stops it spawing multiple
   * @type {boolean}
   */
  #isStarted: boolean = false;

  /**
   * Check if the process is running or not
   * @returns {boolean} If the process is running or not=
   */
  IsRunning(): boolean {
    return this.#isStarted;
  }

  /**
   * Ref to the process spawned using the command
   * @type {import("child_process").ChildProcessWithoutNullStreams  | null}
   */
  #spawnRef: ChildProcessWithoutNullStreams | null = null;

  /**
   * Holds the list of arguments passed to the command on spawn
   * @type {string[]}
   */
  #args: string[] = [];

  /**
   * Holds the output produced by the stdout process
   * @type {Buffer}
   */
  #stdoutBuffer: Buffer = Buffer.alloc(0);

  /** Holds the next request number */
  #seqId = 1;

  /** Get the next request number */
  #getNextSeq = () => this.#seqId++;

  /**
   * Contains a map of specific request Id's and there promises that need to be resolved for there requests
   *
   * - `Key` - The specific request id
   * - `Value` - Resolvers for the promise it is for
   * @type {Map<number, {resolve: (value: any) => void, reject: (reason?: any) => void}>}
   */
  #pendingRequests: Map<
    number,
    { resolve: (value: any) => void; reject: (reason?: any) => void }
  > = new Map();

  /**
   * Required to spawn and manage the typescript process
   * @param {string} command - Used to spawn the process can either be a path to a exe or somthing like a command
   * @param {string[]} args - Arguments to pass on spawn such as ["--stdio"] etc
   * @param {string} workSpaceFolder - Path to the folder this is for for example `c:/dev/some/project`
   * @param {languageId} languageId - The specific language ID to identify it between layers such as `typescript`
   */
  constructor(
    command: string,
    args: string[],
    workSpaceFolder: string,
    languageId: languageId,
  ) {
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

    this.#command = command;
    this.#workSpaceFolder = path.normalize(path.resolve(workSpaceFolder));
    this.#languageId = languageId;
    this.#args = args;
  }

  /**
   * Starts the process for the workspace folder provided and other options provided
   * @returns {Promise<void>} Nothing
   */
  async Start(): Promise<void> {
    try {
      if (this.#isStarted) {
        logger.warn(
          `Typescript process already started for command: ${this.#command} workspace folder: ${this.#workSpaceFolder} language: ${this.#languageId}`,
        );
        return;
      }

      if (
        typeof this.#command !== "string" ||
        this.#command.trim().length === 0
      )
        throw new TypeError("command must be a non empty string");

      if (
        typeof this.#workSpaceFolder !== "string" ||
        this.#workSpaceFolder.trim().length === 0
      )
        throw new TypeError("workSpaceFolder must be a non empty string");

      await fs.access(this.#workSpaceFolder); // we just want to ensure the folder exists

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

      this.#spawnRef.on("exit", () => {
        this.#rejectPendingRequests();
      });

      this.#isStarted = true;
    } catch (error) {
      logger.error(
        error,
        `Failed to start typescript process for command: ${this.#command} workspace folder: ${this.#workSpaceFolder} language: ${this.#languageId}`,
      );
      throw error;
    }
  }

  /**
   * Make a request and await typescript server response and receive it. Resolves to the response body parsed or fails.
   * @param {import("typescript").server.protocol.CommandTypes} command - The specific command to make a request
   * @param {any} params - any additional params it needed
   * @param {{ expectResponse?: boolean }} [options] - Options for the request
   * @returns {Promise<import("typescript").server.protocol.Response["body"] | null>} Promise that resolves to the parsed content or resolves immediately if expectResponse is false
   */
  SendRequest(
    command: import("typescript").server.protocol.CommandTypes,
    params: any,
    options: { expectResponse?: boolean } = { expectResponse: true },
  ): Promise<import("typescript").server.protocol.Response["body"] | null> {
    try {
      const requestId = this.#getNextSeq();
      /** @type {import("typescript").server.protocol.Request} */
      const payload: import("typescript").server.protocol.Request = {
        command: command,
        seq: requestId,
        type: "request",
        arguments: params,
      };

      if (options.expectResponse === false) {
        this.#writeToStdin(payload);
        return Promise.resolve(null);
      }

      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          if (this.#pendingRequests.has(requestId)) {
            this.#pendingRequests
              .get(requestId)
              ?.reject(
                new Error(`Request id: ${requestId} (${command}) timed out`),
              );
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

        this.#writeToStdin(payload);
      });
    } catch (error) {
      logger.error(
        error,
        `Failed to send typescript server request. Request command: ${command} request params: ${JSON.stringify(params)}`,
      );
      throw error;
    }
  }

  /**
   * Send a notification to the typescript server that a text document changed
   * @param {string} filePath - The file path that changed
   * @param {number} version - The version of the file
   * @param {import("vscode-languageserver-protocol").TextDocumentContentChangeEvent[]} changes - The changes made to the file
   * @returns {void}
   */
  DidChangeTextDocument(
    filePath: string,
    version: number,
    changes: import("vscode-languageserver-protocol").TextDocumentContentChangeEvent[],
  ): void {
    if (typeof filePath !== "string" || filePath.trim().length === 0)
      throw new TypeError("filePath must be a non empty string");

    if (typeof version !== "number" || version < 0)
      throw new TypeError("version must be a non negative number");

    if (!Array.isArray(changes))
      throw new TypeError("changes must be an array");

    try {
      /**
       * Holds list of changes mapped from vscode-languageserver-protocol to typescript server protocol
       * this is done as we receive a list of changes from lsp protocol but typescript expects a different format
       * @type {import("typescript").server.protocol.ChangeRequestArgs[]}
       */
      let typescriptChanges: import("typescript").server.protocol.ChangeRequestArgs[] =
        [];

      changes.forEach((change) => {
        // Handle both full document changes and ranged changes
        if ("range" in change) {
          // Ranged change
          typescriptChanges.push({
            file: path.normalize(path.resolve(filePath)),
            line: change.range.start.line + 1, // typescript is 1 based index
            offset: change.range.start.character + 1, // typescript is 1 based index
            endLine: change.range.end.line + 1, // typescript is 1 based index
            endOffset: change.range.end.character + 1, // typescript is 1 based index
            insertString: change.text,
          });
        } else {
          // Full document change - replace entire file content
          typescriptChanges.push({
            file: path.normalize(path.resolve(filePath)),
            line: 1,
            offset: 1,
            endLine: 1,
            endOffset: 1,
            insertString: change.text,
          });
        }
      });

      for (const changeArgs of typescriptChanges) {
        this.#writeToStdin({
          command: protocol.CommandTypes.Change,
          type: "request",
          seq: this.#getNextSeq(),
          arguments: changeArgs,
        });
      }
    } catch (error) {
      logger.error(
        error,
        `Failed to send DidChangeTextDocument notification for file: ${filePath} workspace folder: ${this.#workSpaceFolder} language: ${this.#languageId}`,
      );

      throw error;
    }
  }

  /**
   * Send a notification to the typescript server that a text document was closed
   * @param {string} filePath - The file path that was closed
   */
  DidCloseTextDocument(filePath: string) {
    if (typeof filePath !== "string" || filePath.trim().length === 0)
      throw new TypeError("filePath must be a non empty string");

    try {
      /**
       * Close request uses the FileRequestArgs type
       * @type {import("typescript").server.protocol.FileRequestArgs}
       */
      let params = {
        file: path.normalize(path.resolve(filePath)),
      };

      this.#writeToStdin({
        command: protocol.CommandTypes.Close,
        type: "request",
        seq: this.#getNextSeq(),
        arguments: params,
      });
    } catch (error) {
      logger.error(
        error,
        `Failed to send DidCloseTextDocument notification for file: ${filePath} workspace folder: ${this.#workSpaceFolder} language: ${this.#languageId}`,
      );

      throw error;
    }
  }

  /**
   * Send a notification to the typescript server that a text document was opened
   * @param {string} filePath - The file path that was opened
   * @param {string} content - The content of the file
   */
  DidOpenTextDocument(filePath: string, content: string) {
    if (typeof filePath !== "string" || filePath.trim().length === 0)
      throw new TypeError("filePath must be a non empty string");

    if (typeof content !== "string")
      throw new TypeError("content must be a string");

    try {
      /**
       * @type {import("typescript").server.protocol.OpenRequestArgs}
       */
      let params = {
        file: path.normalize(path.resolve(filePath)),
        fileContent: content,
      };

      this.#writeToStdin({
        command: protocol.CommandTypes.Open,
        type: "request",
        seq: this.#getNextSeq(),
        arguments: params,
      });
    } catch (error) {
      logger.error(
        error,
        `Failed to send DidOpenTextDocument notification for file: ${filePath} workspace folder: ${this.#workSpaceFolder} language: ${this.#languageId}`,
      );

      throw error;
    }
  }

  /**
   * Request diagnostics (errors, warnings) for a specific file
   * @param {string} filePath - The file path to get diagnostics for
   * @param {number} [delay=100] - Delay in milliseconds before requesting diagnostics
   * @returns {void}
   */
  RequestDiagnostics(filePath: string, delay: number = 100): void {
    if (typeof filePath !== "string" || filePath.trim().length === 0)
      throw new TypeError("filePath must be a non empty string");

    if (typeof delay !== "number" || delay < 0)
      throw new TypeError("delay must be a non-negative number");

    try {
      const normalizedPath = path.normalize(path.resolve(filePath));

      /**
       * @type {import("typescript").server.protocol.GeterrRequestArgs}
       */
      const params = {
        files: [normalizedPath],
        delay: 0,
      };

      this.#writeToStdin({
        command: protocol.CommandTypes.Geterr,
        type: "request",
        seq: this.#getNextSeq(),
        arguments: params,
      });
    } catch (error) {
      logger.error(
        error,
        `Failed to request diagnostics for file: ${filePath} workspace folder: ${this.#workSpaceFolder} language: ${this.#languageId}`,
      );
      throw error;
    }
  }

  /**
   * Clears any pending requests to stop hanging and clean up process
   */
  #rejectPendingRequests() {
    if (this.#spawnRef) {
      this.#spawnRef.kill();
    }

    Array.from(this.#pendingRequests.values()).forEach((x) => {
      x.reject(
        new Error("Request hanged or process exited without it finishing"),
      );
    });

    this.#pendingRequests.clear();
  }

  /**
   * Attempts to parse the stdout buffer and then handle any messages parsed
   */
  #parseStdout() {
    while (true) {
      const bufferString = this.#stdoutBuffer.toString("utf-8");

      const prefix = "Content-Length: ";
      const prefixIndex = bufferString.indexOf(prefix);

      if (prefixIndex === -1) {
        break;
      }

      const lineStart = prefixIndex + prefix.length;
      const lineEnd = bufferString.indexOf("\n", lineStart);

      if (lineEnd === -1) {
        break;
      }

      const lengthStr = bufferString.substring(lineStart, lineEnd).trim();
      const contentLength = parseInt(lengthStr, 10);

      if (isNaN(contentLength)) {
        logger.error(
          new Error(`Invalid Content-Length: ${lengthStr}`),
          "Failed to parse Content-Length header",
        );
        this.#stdoutBuffer = this.#stdoutBuffer.subarray(lineEnd + 1);
        continue;
      }

      let bodyStart = lineEnd + 1;
      if (
        bufferString[bodyStart] === "\r" ||
        bufferString[bodyStart] === "\n"
      ) {
        bodyStart++;
      }

      const bodyStartBytes = Buffer.from(
        bufferString.substring(0, bodyStart),
      ).length;
      const totalMessageLength = bodyStartBytes + contentLength;

      if (this.#stdoutBuffer.length < totalMessageLength) {
        break;
      }

      const bodyBuffer = this.#stdoutBuffer.subarray(
        bodyStartBytes,
        totalMessageLength,
      );
      const bodyString = bodyBuffer.toString("utf-8");

      this.#stdoutBuffer = this.#stdoutBuffer.subarray(totalMessageLength);

      try {
        const message = JSON.parse(bodyString);
        this.#handle(message);
      } catch (error) {
        logger.error(error, "Failed to parse TSServer JSON body");
      }
    }
  }

  /**
   * Given a parsed stdout message to notify those intrested and pass the content along where needed
   * @param {import("typescript").server.protocol.Response} respose - Response parsed from typescript server
   */
  #handle(respose: import("typescript").server.protocol.Response) {
    if (respose.type === "response") {
      const seq = respose.request_seq;
      const pending = this.#pendingRequests.get(seq);

      if (pending) {
        if (respose.success) {
          pending.resolve(respose.body);
        } else {
          pending.reject(
            new Error(respose.message || "TSServer request failed"),
          );
        }
        this.#pendingRequests.delete(seq);
      }
    }

    this.#notify(respose);
  }

  /**
   * Send a response to UI if the response is a notification
   * @param {any} notification - Notification received
   */
  #notify(notification: any) {
    if (typeof notification !== "object")
      throw new TypeError("notification must be a object");

    if (!this.#languageId) throw new Error("languageId not set");

    if (!this.#workSpaceFolder) throw new Error("workSpaceFolder not set");

    try {
      // Only process events (notifications), not responses to requests
      if (notification.type !== "event") {
        return;
      }

      const notificationCommands = [
        "syntaxDiag",
        "semanticDiag",
        "suggestionDiag",
        "configFileDiag",
        "projectLoadingStart",
        "projectLoadingFinish",
        "telemetry",
        "typesInstallerInitializationFailed",
        "surveyReady",
        "projectsUpdatedInBackground",
        "beginInstallTypes",
        "endInstallTypes",
        "typesRegistry",
      ];

      if (!notificationCommands.includes(notification.event)) {
        return;
      }

      broadcastToAll("lsp:notification", {
        method: notification.event,
        params: notification.body,
        languageId: this.#languageId,
        workSpaceFolder: this.#workSpaceFolder,
      });

      // We convert it to LSP textDocument/publishDiagnostics
      if (notification.event === "semanticDiag") {
        /** @type {import("typescript").server.protocol.DiagnosticEventBody} */
        let body = notification.body;

        /**
         * This the type UI expects with common JSON rpc publish diag
         * @type {import("vscode-languageserver-protocol").PublishDiagnosticsParams}
         */
        let lspResponse: import("vscode-languageserver-protocol").PublishDiagnosticsParams =
          {
            uri: createUri(body.file),
            diagnostics: body.diagnostics.map((diag: any) => {
              return {
                range: {
                  start: {
                    line: diag.start.line - 1, // TS is 1-based, LSP is 0-based
                    character: diag.start.offset - 1,
                  },
                  end: {
                    line: diag.end.line - 1,
                    character: diag.end.offset - 1,
                  },
                },
                severity: this.#convertSeverity(diag.category),
                code: diag.code,
                source: "typescript",
                message: diag.text,
              };
            }),
          };

        /** @type {import("../type").LanguageServerNotificationResponse} */
        let notificationData: LanguageServerNotificationResponse = {
          languageId: this.#languageId,
          workSpaceFolder: this.#workSpaceFolder,
          params: lspResponse,
        };

        broadcastToAll(
          `lsp:notification:textDocument/publishDiagnostics`,
          notificationData,
        );
      }
    } catch (error) {
      logger.error(
        error,
        "Failed to notify main window of TSServer notification",
      );
    }
  }

  /**
   * Convert TS diagnostic category to LSP severity
   * @param {string} category - TS category: "error", "warning", "suggestion", "message"
   * @returns {import("vscode-languageserver-protocol").DiagnosticSeverity} LSP DiagnosticSeverity (1=Error, 2=Warning, 3=Information, 4=Hint)
   */
  #convertSeverity(
    category: string,
  ): import("vscode-languageserver-protocol").DiagnosticSeverity {
    switch (category) {
      case "error":
        return 1;
      case "warning":
        return 2;
      case "suggestion":
        return 4;
      case "message":
        return 3;
      default:
        return 3;
    }
  }

  /**
   * Attempt to write to the stdin of the spawned command
   * @param {import("typescript").server.protocol.Request} message - The message to send
   * @returns {void} Nothing
   */
  #writeToStdin(message: import("typescript").server.protocol.Request): void {
    if (typeof message !== "object")
      throw new TypeError("message must be a object");

    if (!this.#isStarted)
      throw new Error("cannot write to stdin as process is not started");

    if (!this.#spawnRef)
      throw new Error("Cannot write to stdin as process not yet started");

    if (!this.#spawnRef.stdin.writable)
      throw new Error("Cannot write to stdin of process");

    try {
      const payload = JSON.stringify(message) + "\n";
      this.#spawnRef.stdin.write(payload, "utf8");
    } catch (error) {
      logger.error(
        error,
        `Failed to write to stdin of process command: ${this.#command} workspace folder: ${this.#workSpaceFolder} language: ${this.#languageId}`,
      );
      logger.error(`Raw body ${JSON.stringify(message)}`);
      throw error;
    }
  }
}
