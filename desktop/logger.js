/*
 * Contains code related to logging to the console
 */

/**
 * Simple ANSI-colored logger with timestamp
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
   */
  info(...messages) {
    console.log(`\x1b[36m[INFO]\x1b[0m ${this._timestamp()} -`, ...messages);
  },

  /**
   * Logs warning messages
   * @param {...any} messages
   */
  warn(...messages) {
    console.warn(`\x1b[33m[WARN]\x1b[0m ${this._timestamp()} -`, ...messages);
  },

  /**
   * Logs error messages
   * @param {...any} messages
   */
  error(...messages) {
    console.error(`\x1b[31m[ERROR]\x1b[0m ${this._timestamp()} -`, ...messages);
  },
};

module.exports = { logger };
