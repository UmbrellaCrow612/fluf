import { Logger } from "node-logy";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { COMMANDS, validCommands, type ParsedCommand } from "./protocol.js";

/** Logger */
const logger = new Logger();

/**
 * Get the socket/pipe path based on platform
 */
const getSocketPath = (): string => {
  const platform = os.platform();

  if (platform === "win32") {
    // Windows named pipe
    return "\\\\.\\pipe\\myapp-command-server";
  } else {
    // macOS/Linux UNIX domain socket
    return path.join(os.tmpdir(), "myapp-command-server.sock");
  }
};

const SOCKET_PATH = getSocketPath();

/**
 * Clean up and exit
 */
const cleanExit = () => {
  logger.info("Exiting...");

  if (!client.destroyed) {
    client.end();
  }
};

/**
 * Trys to parse a cmd and it's arguments
 */
const parseCmds = (parts: string[]): ParsedCommand | null => {
  if (parts.length < 1) {
    return null;
  }

  let cmd = parts[0] ?? ("" as any);
  if (!validCommands.has(cmd)) {
    return null;
  }

  return {
    command: cmd,
    args: parts.slice(1),
  };
};

/**
 * Perform logic based on a command
 * @param command The parsed command obj
 */
const handleCommand = (command: ParsedCommand) => {
  switch (command.command) {
    default:
      if (client.destroyed) {
        logger.error("Cannot send command, connection is closed.");
        cleanExit();
        return;
      }

      const payload = JSON.stringify(command);
      logger.info("Sending:", payload);

      client.write(payload + "\n");
      cleanExit();
      break;
  }
};

const client = net.createConnection(SOCKET_PATH, () => {
  logger.info("Connected to command server at:", SOCKET_PATH);

  const args = process.argv.slice(2);

  if (args.length === 0) {
    logger.error("No command provided. Usage: ./index.js <command> [args...]");
    logger.error("Valid commands:", Array.from(validCommands));
    cleanExit();
    process.exit(1);
  }

  const cmd = parseCmds(args);

  if (!cmd) {
    logger.error(
      "Provided invalid cmd:",
      args[0],
      "Valid commands are:",
      Array.from(validCommands),
    );
    cleanExit();
    process.exit(1);
  }

  handleCommand(cmd);
});

client.on("data", (data) => {
  process.stdout.write(data);
});

// Handle errors
client.on("error", (err) => {
  logger.error("Connection error:", err);
});

client.on("end", () => {
  logger.error("Server closed connection");
});

process.on("SIGINT", () => {
  logger.warn("Caught Ctrl-C (SIGINT)");
  cleanExit();
});
