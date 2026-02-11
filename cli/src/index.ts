import { Logger } from "node-logy";
import net from "node:net";
import { validCommands, type ParsedCommand } from "./protocol.js";

/** Logger */
const logger = new Logger();

/**
 * Holds the stdin buffer data
 */
let stdinBuffer = "";

const PORT = 3214;
const HOST = "127.0.0.1";

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

  logger.info("Sending cmd:", cmd);
  // TODO: client.write(JSON.stringify(cmd));
};


const client = net.createConnection({ port: PORT, host: HOST }, () => {
  logger.info("Connected to client tcp server at: ", HOST + PORT);
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

process.stdin.on("data", (chunk) => {
  stdinBuffer += chunk.toString();
  if (stdinBuffer.includes("\n")) {
    parseStdin();
  }
});
