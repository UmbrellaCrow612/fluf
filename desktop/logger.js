/*
 * Contains code related to logging to the console
 */

/**
 * Checks if running in developer mode.
 * Evaluated lazily to allow env loading after imports.
 * @returns {boolean}
 */
function isDevMode() {
  return process.env.MODE === "dev";
}

/**
 * Gets the file, line, and column of the caller.
 * Only used in dev mode.
 *
 * @returns {string}
 */
function getCallerLocation() {
  const stack = new Error().stack;
  if (!stack) return "unknown";

  const lines = stack.split("\n");
  const callerLine = lines[3] || lines[2];

  const match =
    callerLine.match(/\((.*):(\d+):(\d+)\)/) ||
    callerLine.match(/at (.*):(\d+):(\d+)/);

  if (!match) return "unknown";

  const [, file, line, column] = match;
  return `${file}:${line}:${column}`;
}

/**
 * Simple ANSI-colored logger with timestamp.
 * Includes caller info ONLY in dev mode.
 */
const logger = {
  /**
   * Returns the current datetime in ISO format
   * @returns {string}
   */
  _timestamp() {
    return new Date().toISOString();
  },

  /**
   * Logs informational messages
   * @param {string} message
   * @returns {void}
   */
  info(message) {
    const location = isDevMode() ? ` [${getCallerLocation()}]` : "";

    console.log(
      `\x1b[36m[INFO]\x1b[0m ${this._timestamp()}${location} - ${message}`,
    );
  },

  /**
   * Logs warning messages
   * @param {string} message
   * @returns {void}
   */
  warn(message) {
    const location = isDevMode() ? ` [${getCallerLocation()}]` : "";

    console.warn(
      `\x1b[33m[WARN]\x1b[0m ${this._timestamp()}${location} - ${message}`,
    );
  },

  /**
   * Logs error messages
   * @param {string} message The message string
   * @returns {void}
   */
  error(message) {
    const location = isDevMode() ? ` [${getCallerLocation()}]` : "";

    console.error(
      `\x1b[31m[ERROR]\x1b[0m ${this._timestamp()}${location} - ${message}`,
    );
  },
};

module.exports = { logger };
