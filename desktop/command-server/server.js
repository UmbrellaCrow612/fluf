/**
 * Uses IPC contract defined in flufy-ipc-contract to allow other applications to interact with it
 */
const { IPCServer } = require("flufy-ipc-contract/dist/server");
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
const startCommandServer = () => {
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

  server.on("error", (err) => {
    logger.error("Server errored: ", err);
  });

  return server.start();
};

/**
 * Stops the command server
 * @returns {Promise<void>}
 */
const stopCommandServer = () => {
  if (!server) {
    return Promise.resolve();
  }

  return server.stop();
};

module.exports = { startCommandServer, stopCommandServer };
