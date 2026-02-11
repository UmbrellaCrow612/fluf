import { Logger } from "node-logy";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { COMMANDS, validCommands, type ParsedCommand } from "./protocol.js";

/** Logger */
const logger = new Logger();

/**
 * Holds the stdin buffer data
 */
let stdinBuffer = "";

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
 * Extracts exit logic into a callback
 */
const cleanExit = () => {
  logger.info("Exiting...");

  process.stdin.off("data", onStdin);

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
 * Parses the data passed to stdin
 */
const parseStdin = () => {
  let input = stdinBuffer.trim();
  stdinBuffer = "";

  if (!input) return;

  let parts = input.split(/\s+/);
  let cmd = parseCmds(parts);

  if (!cmd) {
    logger.error(
      "Provided invalid cmd:",
      cmd,
      "Valid commands are:",
      Array.from(validCommands),
    );
    return;
  }

  handleCommand(cmd);
};

/**
 * Perform logic based on a command
 * @param command The parsed command obj
 */
const handleCommand = (command: ParsedCommand) => {
  switch (command.command) {
    case COMMANDS.exit:
      cleanExit();
      break;
    default:
      if (client.destroyed) {
        logger.error("Cannot send command, connection is closed.");
        return;
      }

      const payload = JSON.stringify(command);
      logger.info("Sending:", payload);

      client.write(payload + "\n");
      break;
  }
};

const client = net.createConnection(SOCKET_PATH, () => {
  logger.info("Connected to command server at:", SOCKET_PATH);
});

client.on("data", (data) => {
  process.stdout.write(data);
});

// Handle errors
client.on("error", (err) => {
  logger.error("Connection error:", err);
  process.exit(1);
});

client.on("end", () => {
  logger.error("Server closed connection");
  process.exit(0);
});

/**
 * Callback runs on stdin data
 */
const onStdin = (chunk: Buffer) => {
  stdinBuffer += chunk.toString();
  if (stdinBuffer.includes("\n")) {
    parseStdin();
  }
};

process.stdin.on("data", onStdin);
process.on("SIGINT", () => {
  logger.warn("Caught Ctrl-C (SIGINT)");
  cleanExit();
});
