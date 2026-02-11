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
   * Open a file in file x or the editor based on args
   */
  open: "open"
} as const;

/**
 * What value a command type can be
 */
export type CommandType = (typeof COMMANDS)[keyof typeof COMMANDS];

/**
 * Contains a list of valid commands
 */
export const validCommands = new Set(Object.values(COMMANDS));
