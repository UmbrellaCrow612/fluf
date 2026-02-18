/**
 * Uses IPC contract defined in flufy-ipc-contract to allow other applications to interact with it
 */
import { IPCServer, type OpenFileRequest } from "flufy-ipc-contract";
import { logger } from "../logger.js";
import { broadcastToAll } from "../broadcast.js";

/**
 * Holds ref to the IPC server
 * @type {IPCServer | null}
 */
let server: IPCServer | null = null;

/**
 * Starts the IPC server
 * @returns {Promise<void>}
 */
export const startCommandServer = (): Promise<void> => {
  server = new IPCServer();

  server.on("connect", () => {
    logger.info("Command server started");
  });

  server.on("disconnect", () => {
    logger.info("Command server stoppedF");
  });

  server.on("message", (req) => {
    logger.info("Server recieved request: ", req);
  });

  server.on("open:file", (req) => {
    broadcastToAll(`command:open:file`, req);
  });

  server.on("error", (err) => {
    logger.error("Server errored: ", err);
  });

  return server.start();
};

/**
 * Command server event operations
 */
export interface CommandServerEvents {
  "command:open:file": {
    args: [request: OpenFileRequest];
    return: void;
  };
}

/**
 * Stops the command server
 * @returns {Promise<void>}
 */
export const stopCommandServer = (): Promise<void> => {
  if (!server) {
    return Promise.resolve();
  }

  return server.stop();
};
