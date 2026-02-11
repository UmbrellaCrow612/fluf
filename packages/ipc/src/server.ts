import { EventEmitter } from "node:stream";
import { cleanSocket, getSocketPath } from "./index.js";
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

  /**
   * Holds the buffer data from a socket client
   */
  private _buffer = "";

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

    socket.on("data", (data) => {
      this._buffer += data.toString();

      // Handle newline-delimited JSON messages
      let lines = this._buffer.split("\n");
      this._buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim()) {
          this._handleMessage(socket, line);
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
   * @param socket
   * @param rawMessage
   * @returns {void} Nothing
   */
  private _handleMessage(socket: Socket, rawMessage: string): void {}
}
