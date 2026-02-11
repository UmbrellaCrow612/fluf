import { EventEmitter } from "node:stream";
import { getSocketPath } from "./index.js";

export class IPCServer extends EventEmitter {
  /**
   * Path to the socket we spawn for IPC
   */
  private readonly _socketPath = getSocketPath();


  constructor() {
    super();
  }
}
