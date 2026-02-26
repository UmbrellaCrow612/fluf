import { isInsideGithubAction } from "node-github-actions";

/**
 * Safely shut down the logger so it does not hang the process.
 * @param {import("node-logy").Logger} logger - The logger instance.
 * @returns {Promise<void>}
 */
export async function safeExit(logger) {
  await logger.flush();
  await logger.shutdown();
}

/**
 * Shared node logy config options
 * @type {Partial<import("node-logy").LoggerOptions>}
 */
export const nodeLogyOptions = {
  saveToLogFiles: !isInsideGithubAction(),
  showCallSite: true,
};
