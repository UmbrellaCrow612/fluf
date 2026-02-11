export type ParsedCommand = {
  /**
   * The command parsed
   */
  command: CommandType;

  /**
   * Arguments passed along
   */
  args: string[];
};

/**
 * Contains all the values command can be
 */
export const COMMANDS = {
  /**
   * Ping the server and send args across
   */
  ping: "ping",

  /**
   * Used for clients to stop the connection to the tcp server
   */
  exit: "exit",
} as const;

/**
 * What value a command type can be
 */
export type CommandType = (typeof COMMANDS)[keyof typeof COMMANDS];

/**
 * Contains a list of valid commands
 */
export const validCommands = new Set(Object.values(COMMANDS));
