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
   * @param {...any} messages
   * @returns {void}
   */
  info(...messages) {
    const location = isDevMode() ? ` [${getCallerLocation()}]` : "";

    console.log(
      `\x1b[36m[INFO]\x1b[0m ${this._timestamp()}${location} -`,
      ...messages,
    );
  },

  /**
   * Logs warning messages
   * @param {...any} messages
   * @returns {void}
   */
  warn(...messages) {
    const location = isDevMode() ? ` [${getCallerLocation()}]` : "";

    console.warn(
      `\x1b[33m[WARN]\x1b[0m ${this._timestamp()}${location} -`,
      ...messages,
    );
  },

  /**
   * Logs error messages
   * @param {...any} messages
   * @returns {void}
   */
  error(...messages) {
    const location = isDevMode() ? ` [${getCallerLocation()}]` : "";

    console.error(
      `\x1b[31m[ERROR]\x1b[0m ${this._timestamp()}${location} -`,
      ...messages,
    );
  },
};

module.exports = { logger };