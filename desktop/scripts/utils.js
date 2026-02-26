import { Logger } from "node-logy";

/**
 * Safely shut down the logger so it does not hang the process.
 * @param {Logger} logger - The logger instance.
 * @returns {Promise<void>}
 */
export async function safeExit(logger) {
  await logger.flush();
  await logger.shutdown();
}
