import { EventEmitter } from "node:events";
import {
  getSocketPath,
  IPCCommands,
  type CloseFileRequest,
  type CloseFileResponse,
  type ErrorResponse,
  type IPCChannelType,
  type IPCRequest,
  type IPCResponse,
  type KnownResponse,
  type OpenFileRequest,
  type OpenFileResponse,
} from "./index.js";
import { createConnection, Socket } from "node:net";

/**
 * Define all events and their argument tuples for the client
 */
interface IPCClientEvents {
  // When the client connects to server
  connect: [];

  // When the client disconnects from server
  disconnect: [];

  // When error is thrown
  error: [error: Error];

  // When a response is recieved 
  response: [response: IPCResponse<unknown>];
}

/**
 * Client for connecting to the IPCServer
 */
export class IPCClient extends EventEmitter<IPCClientEvents> {
  /**
   * Path to the socket we connect to
   */
  private readonly _socketPath = getSocketPath();

  /**
   * The socket connection to the server
   */
  private _socket: Socket | null = null;

  /**
   * Buffer for incomplete messages
   */
  private _buffer: string = "";

  /**
   * Pending requests awaiting responses (id -> {resolve, reject, timeout})
   */
  private _pendingRequests: Map<
    string,
    {
      resolve: (value: any) => void;
      reject: (reason: Error) => void;
      timeout: NodeJS.Timeout;
    }
  > = new Map();

  /**
   * Default timeout for requests in milliseconds
   */
  private _requestTimeout: number = 30000;

  /**
   * Whether the client is currently connected
   */
  private _connected: boolean = false;

  /**
   * Auto-incrementing request ID counter
   */
  private _requestIdCounter: number = 0;

  /**
   * Get the next request ID
   * @returns {number} The next request ID
   */
  private getNextRequestId = (): number => this._requestIdCounter++;

  constructor() {
    super();
  }

  /**
   * Connects to the IPC server
   * @returns {Promise<void>} A promise that resolves when connected
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this._connected && this._socket) {
        resolve();
        return;
      }

      this._socket = createConnection(this._socketPath);

      this._socket.on("connect", () => {
        this._connected = true;
        this.emit("connect");
        resolve();
      });

      this._socket.on("data", (data) => {
        this._handleData(data.toString());
      });

      this._socket.on("close", () => {
        this._connected = false;
        this._rejectAllPending(new Error("Connection closed"));
        this.emit("disconnect");
      });

      this._socket.on("error", (err) => {
        this._connected = false;
        this._rejectAllPending(err);
        this.emit("error", err);
        reject(err);
      });
    });
  }

  /**
   * Rejects all pending requests (used on disconnect/error)
   */
  private _rejectAllPending(error: Error): void {
    for (const [_, pending] of this._pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }
    this._pendingRequests.clear();
  }

  /**
   * Sends a request to the server and waits for a response
   * @param request The request to make to the server
   * @returns Promise that resolves to the data for the request
   */
  private _sendRequest<T, T2>(
    request: IPCRequest<T>,
  ): Promise<IPCResponse<T2>> {
    return new Promise((resolve, reject) => {
      if (!this._connected || !this._socket) {
        reject(new Error("Not connected to server"));
        return;
      }

      const timeout = setTimeout(() => {
        this._pendingRequests.delete(request.id);
        reject(new Error(`Request ${request.id} timed out`));
      }, this._requestTimeout);

      this._pendingRequests.set(request.id, {
        resolve,
        reject,
        timeout,
      });

      try {
        const json = JSON.stringify(request);
        this._socket.write(json + "\n"); // new line delimited
      } catch (err) {
        clearTimeout(timeout);
        this._pendingRequests.delete(request.id);
        reject(err);
      }
    });
  }

  /**
   * Opens a file on the server
   * @param filePath - Path to the file to open
   * @returns Promise that resolves with the server response
   */
  async openFile(
    filePath: string,
    channel: IPCChannelType,
  ): Promise<OpenFileResponse> {
    const request: OpenFileRequest = {
      id: this.getNextRequestId().toString(),
      channel,
      command: IPCCommands.open,
      data: { filePath },
    };

    return this._sendRequest(request);
  }

  /**
   * Closes a file on the server
   * @param filePath - Path to the file to close
   * @returns Promise that resolves with the server response
   */
  async closeFile(
    filePath: string,
    channel: IPCChannelType,
  ): Promise<CloseFileResponse> {
    const request: CloseFileRequest = {
      id: this.getNextRequestId().toString(),
      channel,
      command: IPCCommands.close,
      data: { filePath },
    };

    return this._sendRequest(request);
  }

  /**
   * Handles incoming data from the socket
   */
  private _handleData(data: string): void {
    this._buffer += data;

    // Handle newline-delimited JSON messages
    let lines = this._buffer.split("\n");
    this._buffer = lines.pop() || ""; // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.trim()) {
        this._handleMessage(line);
      }
    }
  }

  /**
   * Parses and handles incoming messages
   */
  private _handleMessage(rawMessage: string): void {
    try {
      const parsed = JSON.parse(rawMessage) as KnownResponse;

      const pending = this._pendingRequests.get(parsed.id);
      if (pending) {
        clearTimeout(pending.timeout);
        this._pendingRequests.delete(parsed.id);

        if (!parsed.success) {
          pending.reject(
            new Error((parsed as ErrorResponse).error || "Unknown error"),
          );
        } else {
          pending.resolve(parsed);
        }
      }

      this.emit("response", parsed);
    } catch (err) {
      console.error("Failed to parse IPC response:", err);
      this.emit("error", new Error(`Invalid response format: ${rawMessage}`));
    }
  }

  /**
   * Disconnects from the server
   */
  disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (!this._socket) {
        resolve();
        return;
      }

      this._rejectAllPending(new Error("Client disconnected"));

      this._socket.end(() => {
        this._socket?.destroy();
        this._socket = null;
        this._connected = false;
        resolve();
      });
    });
  }
}
