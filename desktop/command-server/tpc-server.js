const net = require("node:net");
const { logger } = require("../logger");


// TODO: on data match cmd then broadcast to all

/**
 * Refrence to the TCP command server
 * @type {import("node:net").Server | null}
 */
let server = null;

/**
 * Create a TCP command server
 * @param {number} port The port to host the command server
 * @param {string} host The host for the command server
 * @returns Nothing
 */
function createCommandServer(port = 3214, host = "127.0.0.1") {
  const envCommandPort = process.env["COMMAND_SERVER_PORT"];
  if (!envCommandPort) {
    logger.warn("ENV does not contain a COMMAND_SERVER_PORT value");
  }
  if (envCommandPort) {
    port = Number(envCommandPort);
  }

  const envCommandHost = process.env["COMMAND_SERVER_HOST"];
  if (!envCommandHost) {
    logger.warn("ENV does not contain a COMMAND_SERVER_HOST");
  }
  if (envCommandHost) {
    host = envCommandHost;
  }

  if (server) {
    console.error("Server already running");
    return;
  }

  server = net.createServer((socket) => {
    logger.info(
      "Client connected:",
      socket.remoteAddress + ":" + socket.remotePort,
    );

    socket.on("data", (data) => {
      logger.info("Received:", data.toString());
      socket.write("Server received: " + data);
    });

    socket.on("end", () => {
      logger.info("Client disconnected");
    });

    socket.on("error", (err) => {
      logger.error("Socket error:", err);
    });
  });

  server.listen(port, host, () => {
    logger.info(`Server listening on ${host}:${port}`);
  });

  server.on("error", (err) => {
    logger.error("Server error:", err);
    server = null;
  });
}

/**
 * Stops the TCP command server
 */
function stopCommandServer() {
  if (!server) {
    console.error("Server not running");
    return;
  }

  server.close(() => {
    logger.info("Server stopped");
    server = null;
  });
}

module.exports = { createCommandServer, stopCommandServer };
