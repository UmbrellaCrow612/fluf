const net = require("node:net");

/**
 * @type {import("node:net").Server | null}
 */
let server = null;

function createCommandServer(port = 3214, host = "127.0.0.1") {
  if (server) {
    console.error("Server already running");
    return;
  }

  server = net.createServer((socket) => {
    console.log(
      "Client connected:",
      socket.remoteAddress + ":" + socket.remotePort,
    );

    socket.on("data", (data) => {
      console.log("Received:", data.toString());
      socket.write("Server received: " + data);
    });

    socket.on("end", () => {
      console.log("Client disconnected");
    });

    socket.on("error", (err) => {
      console.error("Socket error:", err.message);
    });
  });

  server.listen(port, host, () => {
    console.log(`Server listening on ${host}:${port}`);
  });

  server.on("error", (err) => {
    console.error("Server error:", err.message);
    server = null;
  });

  return server;
}

function stopCommandServer() {
  if (!server) {
    console.error("Server not running");
    return;
  }

  server.close(() => {
    console.log("Server stopped");
    server = null;
  });
}

module.exports = { createCommandServer, stopCommandServer };
