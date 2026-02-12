import { IPCClient } from "../client.js";
import { IPCServer } from "../server.js";

async function main() {
  const server = new IPCServer();

  // ✅ Listen for errors - typed as [Error]
  server.on("error", (err) => {
    console.error("Server error:", err.message);
  });

  // ✅ Listen for generic messages - typed as [IPCRequest<unknown>, Socket]
  server.on("message", (request) => {
    console.log(`Received message ${request.id} on channel ${request.channel}`);
  });

  // ✅ Listen for open file requests - typed as [OpenFileRequest, Socket]
  server.on("open:file", (request) => {
    console.log(`Opening file: ${request.data.filePath}`);
  });

  // ✅ Listen for close file requests - typed as [CloseFileRequest, Socket]
  server.on("close:file", (request) => {
    console.log(`Closing file: ${request.data.filePath}`);
  });

  try {
    await server.start();
    console.log("IPC server started on:", server["_socketPath"]);
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }

  const clientOne = new IPCClient();

  clientOne.on("error", (err) => {
    console.error("Clinet error ", err);
  });

  clientOne.on("response", (res) => {
    console.log("Clinet recieved res ", JSON.stringify(res))
  })

  try {
    await clientOne.connect();
    console.log("client connect to server");
  } catch (error) {
    console.error("Clinet failed to connect to server: ", error);
    process.exit(1);
  }

  let response = await clientOne.openFile("/some/file", "file-x");
  if (!response.success) {
    console.error("Open file failed");
  } else {
    console.log("File opened in server");
  }

  let resTwo = await clientOne.closeFile("/some/file", "file-x");
  if (!resTwo.success) {
    console.error("Failed to close file");
  } else {
    console.info("File closed");
  }

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("Shutting down...");
    await clientOne.disconnect();
    await server.stop();
    process.exit(0);
  });
}

main();
