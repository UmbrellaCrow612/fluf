/**
 * Uses IPC contract defined in flufy-ipc-contract to allow other applications to interact with it
 */
const { IPCServer } = require("flufy-ipc-contract/dist/server");
const { broadcastToAll } = require("../broadcast");
const { logger } = require("../logger");

/**
 * Holds ref to the IPC server
 * @type {IPCServer | null}
 */
let server = null;

/**
 * Starts the IPC server
 * @returns {Promise<void>}
 */
const startCommandServer = async () => {
  server = new IPCServer();

  server.on("open:file", (req) => {
    broadcastToAll(`command:open:file`, req);
  });

  await server.start();

  logger.info("Started command IPC server");
};

/**
 * Stops the command server
 * @returns {Promise<void>}
 */
const stopCommandServer = async () => {
  if (!server) {
    return Promise.resolve();
  }

  await server.stop()

  logger.info("Command IPC server stopped")
};

module.exports = { startCommandServer, stopCommandServer };
