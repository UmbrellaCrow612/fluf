import os from "node:os";
import path from "node:path";
import fs from "node:fs";

/**
 * Contains all commands that can be sent to the server to perform actions based on the request
 */
export const IPCCommands = {
  /**
   * Perform a open operation could be opening a file or folder etc
   */
  open: "open",

  /**
   * Perform a close operation could be closing a file or folder
   */
  close: "close",
} as const;

/**
 * Represents all valid commands that can be sent
 */
export type IPCCommandType = (typeof IPCCommands)[keyof typeof IPCCommands];

/**
 * Set containing all valid commands
 */
export const validIPCCommands = new Set(Object.values(IPCCommands));

/**
 * Contains all valid ipc channels, these are seperate applications or areas within the whole application
 */
export const IPCChannels = {
  /**
   * Editor is the main code editor module
   */
  editor: "editor",

  /**
   * File-X is the built in file explorer module
   */
  fileX: "file-x",
} as const;

/**
 * Represents the valid channels you can messages to
 */
export type IPCChannelType = (typeof IPCChannels)[keyof typeof IPCChannels];

/**
 * Contains a set of all valid ipc channels messages can be sent to
 */
export const validIPCChannels = new Set(Object.values(IPCChannels));

/**
 * Represents the base data sent to the server for every request
 */
export type IPCRequest<T> = {
  /**
   * A ID for the given request
   */
  id: string;

  /**
   * The specific group of clinets to notify
   */
  channel: IPCChannelType;

  /**
   * The specific command to run
   */
  command: IPCCommandType;

  /**
   * Addtional data that can be sent for this request
   */
  data: T;
};

/**
 * Data specific to opening a file
 */
export type OpenFileData = {
  /**
   * Absolute path to the file to open
   */
  filePath: string;
};

/**
 * Request type specifically for opening files.
 * Extends base IPCRequest with OpenFileData and enforces correct command/channel.
 */
export type OpenFileRequest = IPCRequest<OpenFileData> & {
  /**
   * Fixed to 'open' command for type safety
   */
  command: typeof IPCCommands.open;
};

/**
 * Type guards to check if it is a open file request
 */
export const isOpenFileRequest = (
  req: IPCRequest<unknown>,
): req is OpenFileRequest => {
  return (
    req.command === IPCCommands.open &&
    validIPCChannels.has(req.channel) &&
    typeof (req.data as OpenFileData)?.filePath === "string"
  );
};

/**
 * Data specific to closing a file
 */
export type CloseFileData = {
  /**
   * Absolute path to the file to close
   */
  filePath: string;
};

/**
 * Request type specifically for closing files.
 * Extends base IPCRequest with CloseFileData and enforces correct command/channel.
 */
export type CloseFileRequest = IPCRequest<CloseFileData> & {
  /**
   * Fixed to 'close' command for type safety
   */
  command: typeof IPCCommands.close;
};

/**
 * Type guard to check if a object is a close file request
 */
export const isCloseFileRequest = (
  req: IPCRequest<unknown>,
): req is CloseFileRequest => {
  return (
    req.command === IPCCommands.close &&
    validIPCChannels.has(req.channel) &&
    typeof (req.data as CloseFileData)?.filePath === "string"
  );
};

/**
 * Validates that a parsed object matches the base IPCRequest shape
 */
export const isValidBaseRequest = (
  obj: unknown,
): obj is IPCRequest<unknown> => {
  if (typeof obj !== "object" || obj === null) return false;
  const req = obj as Record<string, unknown>;

  return (
    typeof req["id"] === "string" &&
    typeof req["channel"] === "string" &&
    typeof req["command"] === "string" &&
    typeof req["data"] === "object"
  );
};

/**
 * Union type of all specific request types
 */
export type KnownRequest = OpenFileRequest | CloseFileRequest;

/**
 * Represents the base shape for all IPC server responses to clients
 */
export type IPCResponse<T> = {
  /**
   * ID matching the original request
   * */
  id: string;

  /**
   * Whether the operation was successful
   */
  success: boolean;

  /**
   * Specific data for this response
   */
  data: T;

  /**
   * Error message if success is false
   */
  error?: string;
};

/**
 * Type guard to validate that a value is a valid IPCResponse
 */
export const isValidIPCResponse = <T>(obj: unknown): obj is IPCResponse<T> => {
  if (typeof obj !== "object" || obj === null) return false;
  const res = obj as Record<string, unknown>;

  const hasValidBase =
    typeof res["id"] === "string" &&
    typeof res["success"] === "boolean" &&
    "data" in res;

  if (!hasValidBase) return false;

  if (res["success"] === false) {
    return typeof res["error"] === "string";
  }

  return true;
};

/**
 * Contains all the error information
 */
export type ErrorData = {};

/**
 * Response sent when a error has occured for a given request
 */
export type ErrorResponse = IPCResponse<ErrorData>;

/**
 * Response for @see {OpenFileRequest}
 */
export type OpenFileResponse = IPCResponse<OpenFileData>

/**
 * Response for @see {CloseFileRequest}
 */
export type CloseFileResponse = IPCResponse<CloseFileData>

/**
 * Union type of all specific response types
 */
export type KnowResponse = ErrorResponse | OpenFileResponse;

/**
 * Name of the pipe/socket used for IPC communication.
 * Used as the identifier for both Windows named pipes and Unix domain sockets.
 */
export const PIPE_NAME = "fluffy-ipc-pipe";

/**
 * Windows named pipe prefix/namespace.
 * @see {@link https://learn.microsoft.com/en-us/windows/win32/ipc/pipe-names}
 */
export const WINDOWS_PIPE_PREFIX = "\\\\.\\pipe";

/**
 * Returns the platform-specific path for IPC communication.
 *
 * On Windows, returns a named pipe path in the `\\.\pipe\` namespace.
 * On Unix-like systems (Linux, macOS), returns a Unix domain socket path
 * in the system's temporary directory.
 *
 * @returns {string} The absolute path to the IPC endpoint
 *
 * @example
 * ```ts
 * // Windows
 * getSocketPath(); // "\\\\.\\pipe\\fluffy-ipc-pipe"
 *
 * // macOS/Linux
 * getSocketPath(); // "/tmp/fluffy-ipc-pipe.sock"
 * ```
 *
 * @remarks
 * - Windows named pipes do not use the filesystem; `\\.\pipe\` is a special namespace
 * - Unix domain sockets are created as actual files in `os.tmpdir()`
 * - The socket file on Unix must be unlinked before binding if it already exists
 *
 * @see {@link https://nodejs.org/api/net.html#ipc-support}
 */
export const getSocketPath = (): string => {
  const platform = os.platform();

  if (platform === "win32") {
    return path.join(WINDOWS_PIPE_PREFIX, PIPE_NAME);
  } else {
    return path.join(os.tmpdir(), `${PIPE_NAME}.sock`);
  }
};

/**
 * Cleans up the socket file if it exists.
 *
 * On Windows, this is a no-op since named pipes don't use filesystem entries.
 * On Unix-like systems, removes the socket file from the temporary directory
 * to prevent "address already in use" errors when binding.
 *
 * @returns {boolean} `true` if a file was removed, `false` otherwise
 */
export const cleanSocket = (): boolean => {
  if (os.platform() === "win32") {
    // Windows named pipes don't create filesystem entries
    return false;
  }

  const socketPath = getSocketPath();

  try {
    fs.accessSync(socketPath);
  } catch {
    // File doesn't exist
    return false;
  }

  try {
    fs.unlinkSync(socketPath);
    return true;
  } catch (err) {
    // Socket might be in use by another process
    throw new Error(
      `Failed to remove stale socket at ${socketPath}: ${(err as Error).message}`,
    );
  }
};
