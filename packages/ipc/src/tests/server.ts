import { IPCServer } from "../server.js";

async function main() {
  const server = new IPCServer();

  server.on("error", (err) => {
    console.error("Server error:", err.message);
  });

  server.on("message", (request) => {
    console.log(`Received message ${request.id} on channel ${request.channel}`);
  });

  server.on("open:file", (request) => {
    console.log(`Opening file: ${request.data.filePath}`);
  });

  server.on("close:file", (request) => {
    console.log(`Closing file: ${request.data.filePath}`);
  });

  server.on("connect", () => {
    console.log("Connected server")
  })

  server.on("disconnect", () => {
    console.log("Server disconnnected")
  })

  try {
    await server.start();
    console.log("IPC server started on:", server["_socketPath"]);
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("Shutting down...");
    await server.stop();
    process.exit(0);
  });
}

main();
