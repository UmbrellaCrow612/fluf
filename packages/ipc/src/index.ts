import os from "node:os";
import path from "node:path";
import fs from "node:fs";

/**
 * Represents the data sent to the server
 */
export type IPCRequest<T> = {
  /**
   * A ID for the given request
   */
  id: string;

  /**
   * Addtional data that can be sent for this request
   */
  data?: T;
};

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
