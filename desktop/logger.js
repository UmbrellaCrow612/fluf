const fs = require("fs");
const path = require("path");

/**
 * Checks whether the application is running in developer mode.
 * Evaluated lazily to allow environment loading after imports.
 *
 * @returns {boolean} True if MODE=dev
 */
function isDevMode() {
  return process.env.MODE === "dev";
}

/**
 * Resolves the file, line, and column of the calling function.
 * Only used in developer mode for debugging.
 *
 * @returns {string} Caller location in "file:line:column" format
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
 * Directory where log files are stored.
 * Resolved relative to the current working directory.
 *
 * @type {string}
 */
const LOG_DIR = path.join(process.cwd(), "logs");

/**
 * Number of days to retain log files.
 *
 * @type {number}
 */
const RETENTION_DAYS = 30;

/**
 * Needs to make the log file exists with some blocking but only on load
 */
fs.mkdirSync(LOG_DIR, { recursive: true });

/**
 * Resolves the log file path for the current date.
 * This naturally rotates logs daily.
 *
 * @returns {string} Absolute path to today's log file
 */
function getTodayLogFilePath() {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return path.join(LOG_DIR, `app-${date}.log`);
}

/**
 * Flag to ensure old logs are trimmed only once per process lifecycle.
 *
 * @type {boolean}
 */
let hasTrimmedOldLogs = false;

/**
 * Deletes log files older than the configured retention period.
 * Runs asynchronously and silently ignores failures.
 *
 * @returns {void}
 */
function trimOldLogs() {
  if (hasTrimmedOldLogs) return;
  hasTrimmedOldLogs = true;

  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;

  fs.promises
    .readdir(LOG_DIR)
    .then((files) => {
      files.forEach((file) => {
        const match = file.match(/^app-(\d{4}-\d{2}-\d{2})\.log$/);
        if (!match) return;

        const fileDate = new Date(match[1]).getTime();
        if (fileDate < cutoff) {
          fs.promises.unlink(path.join(LOG_DIR, file)).catch(() => {});
        }
      });
    })
    .catch(() => {});
}

/**
 * In-memory queue of pending log entries.
 *
 * @type {string[]}
 */
const logQueue = [];

/**
 * Indicates whether a flush operation is currently in progress.
 *
 * @type {boolean}
 */
let isFlushing = false;

/**
 * Enqueues a formatted log entry for asynchronous file writing.
 *
 * @param {string} entry Formatted log line
 * @returns {void}
 */
function enqueueLog(entry) {
  logQueue.push(entry);
  trimOldLogs();
  flushQueueAsync();
}

/**
 * Flushes queued log entries to disk asynchronously in batches.
 * Preserves ordering and avoids concurrent writes.
 *
 * @returns {Promise<void>}
 */
async function flushQueueAsync() {
  if (isFlushing) return;
  isFlushing = true;

  try {
    while (logQueue.length > 0) {
      const batch = logQueue.splice(0, logQueue.length).join("");
      const filePath = getTodayLogFilePath();
      await fs.promises.appendFile(filePath, batch, "utf8");
    }
  } catch (err) {
    // Avoid recursion into logger on failure
    console.error("Failed to write logs:", err);
  } finally {
    isFlushing = false;
  }
}

/**
 * Simple ANSI-colored logger with async file persistence.
 */
const logger = {
  /**
   * Returns the current timestamp in ISO 8601 format.
   *
   * @returns {string}
   */
  _timestamp() {
    return new Date().toISOString();
  },

  /**
   * Formats a log entry for file output.
   *
   * @param {"INFO"|"WARN"|"ERROR"} level Log level
   * @param {string} message Log message
   * @param {string} location Caller location (optional)
   * @returns {string} Formatted log entry
   */
  _formatFileEntry(level, message, location) {
    return `[${level}] ${this._timestamp()}${location} - ${message}\n`;
  },

  /**
   * Logs an informational message.
   *
   * @param {string} message Message to log
   * @returns {void}
   */
  info(message) {
    const location = isDevMode() ? ` [${getCallerLocation()}]` : "";

    console.log(
      `\x1b[36m[INFO]\x1b[0m ${this._timestamp()}${location} - ${message}`,
    );

    enqueueLog(this._formatFileEntry("INFO", message, location));
  },

  /**
   * Logs a warning message.
   *
   * @param {string} message Message to log
   * @returns {void}
   */
  warn(message) {
    const location = isDevMode() ? ` [${getCallerLocation()}]` : "";

    console.warn(
      `\x1b[33m[WARN]\x1b[0m ${this._timestamp()}${location} - ${message}`,
    );

    enqueueLog(this._formatFileEntry("WARN", message, location));
  },

  /**
   * Logs an error message.
   *
   * @param {string} message Message to log
   * @returns {void}
   */
  error(message) {
    const location = isDevMode() ? ` [${getCallerLocation()}]` : "";

    console.error(
      `\x1b[31m[ERROR]\x1b[0m ${this._timestamp()}${location} - ${message}`,
    );

    enqueueLog(this._formatFileEntry("ERROR", message, location));
  },
};

/**
 * Logs an error object with all its details using the logger.
 * Handles Error instances, objects, and primitive values gracefully.
 *
 * @param {any} error - The error to log (Error, object, string, etc.)
 * @param {string} [context] - Optional context message to prefix the error
 * @returns {void}
 */
function logError(error, context) {
  // Log context if provided
  if (context) {
    logger.error(context);
  }

  // Handle null/undefined
  if (error == null) {
    logger.error(`Error: ${error}`);
    return;
  }

  // Handle Error instances
  if (error instanceof Error) {
    logger.error(`Error Name: ${error.name}`);
    logger.error(`Error Message: ${error.message}`);

    if (error.stack) {
      logger.error(`Stack Trace:\n${error.stack}`);
    }

    // Log any custom properties - cast to any to avoid index signature error
    const errorObj = /** @type {any} */ (error);
    const customProps = Object.keys(errorObj).filter(
      (key) => key !== "name" && key !== "message" && key !== "stack",
    );

    if (customProps.length > 0) {
      logger.error("Additional Properties:");
      customProps.forEach((key) => {
        logger.error(`  ${key}: ${JSON.stringify(errorObj[key])}`);
      });
    }

    return;
  }

  // Handle objects
  if (typeof error === "object") {
    try {
      logger.error(`Error Object: ${JSON.stringify(error, null, 2)}`);
    } catch (stringifyError) {
      // Fallback if object has circular references
      logger.error(`Error Object (non-serializable): ${error.toString()}`);
    }
    return;
  }

  // Handle primitives (string, number, boolean)
  logger.error(`Error: ${String(error)}`);
}
process.on("beforeExit", async () => {
  await flushQueueAsync();
});

process.on("SIGINT", async () => {
  await flushQueueAsync();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await flushQueueAsync();
  process.exit(0);
});

module.exports = { logger, logError };
