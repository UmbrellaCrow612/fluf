import os from "node:os";
import path from "node:path";

/**
 * Current version of IPC protocol
 */
export const PROTOCOL_VERSION = "1.0";

/**
 * Enumeration of available IPC (Inter-Process Communication) method names.
 * Used to standardize communication between processes and ensure type safety.
 *
 * @example
 * ```typescript
 * // Using in a request
 * const request: IPCRequest = {
 *   id: "123-456",
 *   method: IPCMethods.ping,
 *   data: { message: "hello" }
 * };
 * ```
 */
export const IPCMethods = {
  /**
   * Ping the server and send arguments across the IPC boundary.
   * Used for health checks and basic connectivity verification.
   */
  ping: "ping",

  /**
   * Open a resource, connection, or channel.
   * Implementation details depend on the specific IPC handler.
   */
  open: "open",

  /**
   * Close a resource, connection, or channel.
   * Should be paired with previous `open` calls to clean up resources.
   */
  close: "close",
} as const;

/**
 * Union type of all valid IPC method names.
 * Derived from the {@link IPCMethods} constant object.
 *
 * @example
 * ```typescript
 * function handleMethod(method: IPCMethodType) {
 *   if (method === IPCMethods.ping) {
 *     // handle ping
 *   }
 * }
 * ```
 */
export type IPCMethodType = (typeof IPCMethods)[keyof typeof IPCMethods];

/**
 * Set containing all valid IPC method strings for O(1) lookup validation.
 * Useful for runtime checking of incoming method names.
 *
 * @example
 * ```typescript
 * if (validIPCMethods.has(incomingMethod)) {
 *   // Safe to process as IPCMethodType
 * }
 * ```
 */
export const validIPCMethods = new Set(Object.values(IPCMethods));

/**
 * Represents the standard shape each IPC request will take.
 * All requests must conform to this structure for proper routing and handling.
 *
 * @template T - Optional type parameter for the data payload
 *
 * @example
 * ```typescript
 * const request: IPCRequest = {
 *   id: crypto.randomUUID(),
 *   method: IPCMethods.open,
 *   data: { path: "/tmp/file.txt" }
 * };
 * ```
 */
export type IPCRequest<T = any> = {
  /**
   * Unique identifier for correlating requests with responses.
   * Should be generated using UUID, nanoid, or similar scheme.
   * Example format: `"123-4321"` or `"550e8400-e29b-41d4-a716-446655440000"`
   */
  id: string;

  /**
   * The IPC method to invoke. Must be one of the defined {@link IPCMethods}.
   */
  method: IPCMethodType;

  /**
   * Optional payload data to send with the request.
   * Type varies depending on the specific method being called.
   */
  data?: T;
};

/**
 * Represents the standard shape each IPC response will take.
 * Responses mirror their corresponding requests via the `id` and `method` fields.
 *
 * @template T - Optional type parameter for the data payload
 *
 * @example
 * ```typescript
 * const response: IPCResponse = {
 *   id: request.id, // Must match the request ID
 *   method: request.method,
 *   data: { success: true, result: [] }
 * };
 * ```
 */
export type IPCResponse<T = any> = {
  /**
   * ID matching the original request for correlation.
   * Clients use this to match async responses to pending requests.
   */
  id: string;

  /**
   * The method that was invoked, echoing back from the request.
   * Useful for routing responses to the correct handler.
   */
  method: IPCMethodType;

  /**
   * Optional response payload containing results or error information.
   * Structure depends on the method and success/failure state.
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