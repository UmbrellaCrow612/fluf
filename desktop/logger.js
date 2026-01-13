/*
 * Console + async file logger
 */

const fs = require("fs/promises");
const path = require("path");

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

const LOG_FILE_PATH = path.join(process.cwd(), "app.log");

/**
 * @type {string[]}
 */
const logQueue = [];
let isFlushing = false;

/**
 * Push a log entry into the async queue
 * @param {string} entry
 */
function enqueueLog(entry) {
  logQueue.push(entry);
  flushQueueAsync();
}

/**
 * Flush queue to disk asynchronously (batched)
 */
async function flushQueueAsync() {
  if (isFlushing) return;
  isFlushing = true;

  try {
    while (logQueue.length > 0) {
      const batch = logQueue.splice(0, logQueue.length).join("");
      await fs.appendFile(LOG_FILE_PATH, batch, "utf8");
    }
  } catch (err) {
    // Last-resort failure handling (do NOT recurse into logger)
    console.error("Failed to write logs to file:", err);
  } finally {
    isFlushing = false;
  }
}

const logger = {
  /**
   * Returns the current datetime in ISO format
   * @returns {string}
   */
  _timestamp() {
    return new Date().toISOString();
  },

  /**
   * Formats a log entry for file output
   * @param {string} level
   * @param {string} message
   * @param {string} location
   * @returns {string} formatted string
   */
  _formatFileEntry(level, message, location) {
    return `[${level}] ${this._timestamp()}${location} - ${message}\n`;
  },

  /**
   * Logs informational messages
   * @param {string} message
   */
  info(message) {
    const location = isDevMode() ? ` [${getCallerLocation()}]` : "";

    console.log(
      `\x1b[36m[INFO]\x1b[0m ${this._timestamp()}${location} - ${message}`,
    );

    enqueueLog(this._formatFileEntry("INFO", message, location));
  },

  /**
   * Logs warning messages
   * @param {string} message
   */
  warn(message) {
    const location = isDevMode() ? ` [${getCallerLocation()}]` : "";

    console.warn(
      `\x1b[33m[WARN]\x1b[0m ${this._timestamp()}${location} - ${message}`,
    );

    enqueueLog(this._formatFileEntry("WARN", message, location));
  },

  /**
   * Logs error messages
   * @param {string} message
   */
  error(message) {
    const location = isDevMode() ? ` [${getCallerLocation()}]` : "";

    console.error(
      `\x1b[31m[ERROR]\x1b[0m ${this._timestamp()}${location} - ${message}`,
    );

    enqueueLog(this._formatFileEntry("ERROR", message, location));
  },
};

module.exports = { logger };
