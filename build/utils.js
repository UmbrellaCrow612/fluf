import { isInsideGithubAction } from "node-github-actions";

/**
 * Creates a safe run options
 * @param {string} before
 * @param {string} after
 * @param {string} errorMessage
 * @param {import("node-logy").Logger} logger
 * @returns {import("node-github-actions").SafeRunOptions}
 */
export function createSafeRunOptions(before, after, errorMessage, logger) {
  return {
    exitOnFailed: true,
    exitFailCode: 1,
    onAfter: () => {
      logger.info(after);
    },
    onBefore: () => {
      logger.info(before);
    },
    onFail: async (err) => {
      logger.error(errorMessage, err);
      await logger.flush();
      await logger.shutdown();
    },
  };
}

/**
 * Safely shut down the logger so it does not hang the process, then exit.
 * @param {import("node-logy").Logger} logger - The logger instance.
 * @returns {Promise<void>}
 */
export async function safeExit(logger) {
  await logger.flush();
  await logger.shutdown();
  process.exit();
}

/**
 * Shared node logy config options
 * @type {Partial<import("node-logy").LoggerOptions>}
 */
export const nodeLogyOptions = {
  saveToLogFiles: !isInsideGithubAction(),
  showCallSite: true,
};
