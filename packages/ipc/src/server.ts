import { EventEmitter } from "node:stream";
import {
  cleanSocket,
  getSocketPath,
  isCloseFileRequest,
  isOpenFileRequest,
  isValidBaseRequest,
  validIPCChannels,
  validIPCCommands,
  type CloseFileRequest,
  type ErrorResponse,
  type IPCRequest,
  type IPCResponse,
  type OpenFileRequest,
} from "./index.js";
import { createServer, Server, Socket } from "node:net";

/**
 * Should only be started by the main fluf application only. Is the main server.
 */
export class IPCServer extends EventEmitter {
  /**
   * Path to the socket we spawn for IPC server
   */
  private readonly _socketPath = getSocketPath();

  /**
   * The socket server we spawn for this class
   */
  private _server: Server | null = null;

  /**
   * Set of clients that have connected to this server, keeps track of them.
   */
  private _clients: Set<Socket> = new Set<Socket>();

  constructor() {
    super();
  }

  /**
   * Starts the IPC server
   * @returns {Promis<void>} A promise that needs awaiting for the server to get everything ready
   */
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this._server) {
        resolve();
        return;
      }

      this._server = createServer((socket) => {
        this._handleConnection(socket);
      });

      this._server.on("error", (err) => {
        // try to restart on error
        if ((err as NodeJS.ErrnoException).code === "EADDRINUSE") {
          try {
            cleanSocket();
            this._server!.listen(this._socketPath, () => {
              resolve();
            });
          } catch {
            reject(err);
          }
        } else {
          reject(err);
        }
      });

      this._server.listen(this._socketPath, () => {
        resolve();
      });
    });
  }

  /**
   * Handles when a new socket has connected to the server
   * @param {Socket} socket - The socket that has connected to the server
   * @returns {void} Nothing
   */
  private _handleConnection(socket: Socket): void {
    this._clients.add(socket);

    /**
     * Each connection socket gets it's own buffer
     */
    let _buffer: string = "";

    socket.on("data", (data) => {
      _buffer += data.toString();

      // Handle newline-delimited JSON messages
      let lines = _buffer.split("\n");
      _buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim()) {
          this._handleMessage(line, socket);
        }
      }
    });

    socket.on("close", () => {
      this._clients.delete(socket);
    });

    socket.on("error", () => {
      this._clients.delete(socket);
    });
  }

  /**
   * Parses and handles incoming messages
   * @param {string} rawMessage - The raw JSON string message
   * @param {Socket} socket - The socket that sent the message
   * @returns {void} Nothing
   */
  private _handleMessage(rawMessage: string, socket: Socket): void {
    try {
      const parsed = JSON.parse(rawMessage);

      if (!isValidBaseRequest(parsed)) {
        this._sendErrorResponse(socket, "unknown", "Invalid request structure");
        this.emit(
          "error",
          new Error(`Invalid request structure: ${rawMessage}`),
        );
        return;
      }

      const message = parsed as IPCRequest<unknown>;

      if (!validIPCChannels.has(message.channel)) {
        this._sendErrorResponse(
          socket,
          message.id,
          `Invalid channel: ${message.channel}`,
        );
        this.emit("error", new Error(`Invalid channel: ${message.channel}`));
        return;
      }

      if (!validIPCCommands.has(message.command)) {
        this._sendErrorResponse(
          socket,
          message.id,
          `Invalid command: ${message.command}`,
        );
        this.emit("error", new Error(`Invalid command: ${message.command}`));
        return;
      }

      if (isOpenFileRequest(message)) {
        this._handleOpenFile(message, socket);
      } else if (isCloseFileRequest(message)) {
        this._handleCloseFile(message, socket);
      } else {
        this._sendErrorResponse(
          socket,
          message.id,
          `Command '${message.command}' not implemented`,
        );
        this.emit(
          "error",
          new Error(`Unimplemented command: ${message.command}`),
        );
      }

      // Emit on server for general handling
      this.emit("message", message, socket);

      // Also emit channel-specific event
      this.emit(`channel:${message.channel}`, message, socket);

      // Emit command-specific event
      this.emit(`command:${message.command}`, message, socket);
    } catch (err) {
      console.error("Failed to parse IPC message:", err);
      this._sendErrorResponse(
        socket,
        "unknown",
        `Invalid JSON: ${(err as Error).message}`,
      );
      this.emit("error", new Error(`Invalid message format: ${rawMessage}`));
    }
  }

  /**
   * Handles open file requests
   * @param {OpenFileRequest} request - The open file request
   * @param {Socket} socket - The socket to respond to
   */
  private _handleOpenFile(request: OpenFileRequest, socket: Socket): void {
    // Emit specific event for open file operations
    this.emit("open:file", request, socket);

    // Default success response (can be overridden by event listeners)
    if (this.listenerCount("open:file") === 0) {
      this._sendSuccessResponse(socket, request.id, {
        filePath: request.data.filePath,
      });
    }
  }

  /**
   * Handles close file requests
   * @param {CloseFileRequest} request - The close file request
   * @param {Socket} socket - The socket to respond to
   */
  private _handleCloseFile(request: CloseFileRequest, socket: Socket): void {
    // Emit specific event for close file operations
    this.emit("close:file", request, socket);

    // Default success response (can be overridden by event listeners)
    if (this.listenerCount("close:file") === 0) {
      this._sendSuccessResponse(socket, request.id, {
        filePath: request.data.filePath,
      });
    }
  }

  /**
   * Sends a success response to a socket
   * @param {Socket} socket - The socket to send to
   * @param {string} id - The request ID
   * @param {T} data - The response data
   */
  private _sendSuccessResponse<T>(socket: Socket, id: string, data: T): void {
    const response: IPCResponse<T> = {
      id,
      success: true,
      data,
    };
    this._sendResponse(socket, response);
  }

  /**
   * Sends a response to a socket
   * @param {Socket} socket - The socket to send to
   * @param {IPCResponse<T>} response - The response to send
   */
  private _sendResponse<T>(socket: Socket, response: IPCResponse<T>): void {
    try {
      const json = JSON.stringify(response);
      socket.write(json + "\n");
    } catch (err) {
      console.error("Failed to send IPC response:", err);
      this.emit(
        "error",
        new Error(`Failed to send response: ${(err as Error).message}`),
      );
    }
  }

  /**
   * Sends an error response to a socket
   * @param {Socket} socket - The socket to send to
   * @param {string} id - The request ID
   * @param {string} error - The error message
   */
  private _sendErrorResponse(socket: Socket, id: string, error: string): void {
    const response: ErrorResponse = {
      id,
      success: false,
      data: {},
      error,
    };
    this._sendResponse(socket, response);
  }

  /**
   * Cleans up / stops the IPC server
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      for (const client of this._clients) {
        client.end();
        client.destroy();
      }
      this._clients.clear();

      if (!this._server) {
        resolve();
        return;
      }

      this._server.close(() => {
        cleanSocket();
        this._server = null;
        resolve();
      });
    });
  }
}
