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
export declare const COMMANDS: {
    /**
     * Ping the server and send args across
     */
    readonly ping: "ping";
};
/**
 * What value a command type can be
 */
export type CommandType = (typeof COMMANDS)[keyof typeof COMMANDS];
/**
 * Contains a list of valid commands
 */
export declare const validCommands: Set<"ping">;
//# sourceMappingURL=protocol.d.ts.map