import { EventEmitter } from "node:stream";
import {
  cleanSocket,
  getSocketPath,
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
          this._handleMessage(line);
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
   * @returns {void} Nothing
   */
  private _handleMessage(rawMessage: string): void {
    try {
      const message: IPCRequest<any> = JSON.parse(rawMessage);

      // TODO make rewquest shape

      // Emit on server for general handling

      // Also emit a catch-all event
    } catch (err) {
      console.error("Failed to parse IPC message:", err);
      this.emit("error", new Error(`Invalid message format: ${rawMessage}`));
    }
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
