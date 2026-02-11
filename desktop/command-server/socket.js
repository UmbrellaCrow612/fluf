const net = require("node:net");
const os = require("node:os");
const path = require("node:path");
const fs = require("node:fs");
const { logger } = require("../logger");

/**
 * Reference to the command server
 * @type {import("node:net").Server | null}
 */
let server = null;

/**
 * Path to the socket/pipe
 * @type {string | null}
 */
let socketPath = null;

/**
 * Get the default socket/pipe path based on platform
 * @returns {string}
 */
function getDefaultSocketPath() {
  const platform = os.platform();
  const tmpDir = os.tmpdir();

  if (platform === "win32") {
    // Windows named pipe path
    return path.join("\\\\.\\pipe", "myapp-command-server");
  } else {
    // macOS/Linux UNIX domain socket
    return path.join(tmpDir, "myapp-command-server.sock");
  }
}

/**
 * Clean up existing socket file (Unix only)
 * @param {string} path
 */
function cleanupSocketFile(path) {
  if (os.platform() !== "win32" && fs.existsSync(path)) {
    try {
      fs.unlinkSync(path);
      logger.info(`Cleaned up existing socket file: ${path}`);
    } catch (err) {
      logger.warn(`Failed to clean up socket file: `, err);
    }
  }
}

/**
 * Handle a command sent from IPC
 * @param {any} parsedCmd - The command object
 */
function handleParsedCommand(parsedCmd) {
  switch (parsedCmd.command) {
    case "ping":
      logger.info("PING recieved");
      break;

    default:
      break;
  }
}

/**
 * Create a command server using UNIX domain sockets (macOS/Linux)
 * or named pipes (Windows)
 * @returns {void}
 */
function createCommandServer() {
  const envSocketPath = process.env["COMMAND_SERVER_SOCKET"];

  if (!envSocketPath) {
    logger.warn("ENV does not contain a COMMAND_SERVER_SOCKET value");
  }

  socketPath = getDefaultSocketPath();

  if (server) {
    logger.error("Server already running");
    return;
  }

  cleanupSocketFile(socketPath);

  server = net.createServer((socket) => {
    const clientInfo =
      os.platform() === "win32"
        ? "named-pipe-client"
        : socket.remoteAddress || "unix-socket-client";

    logger.info("Client connected:", clientInfo);

    socket.on("data", (data) => {
      try {
        let parsed = JSON.parse(data.toString());
        handleParsedCommand(parsed)
      } catch (error) {
        logger.error("Failed tro parse data sent to socket: ", error);
      }
    });

    socket.on("end", () => {
      logger.info("Client disconnected");
    });

    socket.on("error", (err) => {
      logger.error("Socket error:", err);
    });
  });

  server.listen(socketPath, () => {
    logger.info(`Command server listening on ${socketPath}`);

    // Set permissions on Unix socket for security (readable/writable by owner only)
    if (os.platform() !== "win32" && socketPath) {
      try {
        fs.chmodSync(socketPath, 0o600);
        logger.info("Socket permissions set to 0600 (owner read/write only)");
      } catch (err) {
        logger.warn("Failed to set socket permissions:", err);
      }
    }
  });

  server.on("error", (err) => {
    logger.error("Server error:", err);
    server = null;
    socketPath = null;
  });

  const cleanup = () => {
    stopCommandServer();
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

/**
 * Stops the command server
 */
function stopCommandServer() {
  if (!server) {
    logger.error("Server not running");
    return;
  }

  server.close(() => {
    logger.info("Command server stopped");

    // Clean up socket file on Unix
    if (socketPath && os.platform() !== "win32") {
      cleanupSocketFile(socketPath);
    }

    server = null;
    socketPath = null;
  });
}

/**
 * Get the current socket/pipe path
 * @returns {string | null}
 */
function getSocketPath() {
  return socketPath;
}

module.exports = {
  createCommandServer,
  stopCommandServer,
  getSocketPath,
};
