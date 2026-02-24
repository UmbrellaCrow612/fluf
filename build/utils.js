import { Logger } from "node-logy";
import { spawn } from "node:child_process";

/**
 * Safely run a piece of logic.
 * If it fails, it will exit and perform any necessary cleanup.
 * @param {() => Promise<void> | void} callback - The logic to run.
 * @param {Logger} logger - Logger instance.
 * @param {string} errMessage - Message to show on failure.
 * @returns {Promise<void>}
 */
export async function safeRun(callback, logger, errMessage) {
  try {
    await callback();
  } catch (error) {
    logger.error(errMessage, error);
    await logger.flush(); // we do this because calling safe run directly will continue the event loop a bit longer than directly calling it
    await logger.shutdown();
    process.exit(1);
  }
}

/**
 * Safely shut down the logger so it does not hang the process, then exit.
 * @param {Logger} logger - The logger instance.
 * @param {1 | 0} code - The exit code. Zero means no error; one indicates an error.
 * @returns {Promise<void>}
 */
export async function safeExit(logger, code) {
  await logger.flush();
  await logger.shutdown();
  process.exit(code);
}

/**
 * Run a given command and wait for it to finish.
 * @param {string} command - The command to run.
 * @param {string[]} args - Additional arguments to pass to the command.
 * @param {import("node:child_process").SpawnOptionsWithoutStdio} options
 * @param {number} timeout - How long (in seconds) to wait before rejecting.
 * @returns {Promise<void>}
 */
export function runCommand(command, args, options, timeout) {
  return new Promise((resolve, reject) => {
    const spwn = spawn(command, args, {
      stdio: "inherit",
      shell: true,
      ...options,
    });

    const tid = setTimeout(() => {
      spwn.kill();
      reject(new Error("Command timed out and took too long to exit"));
    }, timeout * 1000);

    spwn.on("error", (err) => {
      clearTimeout(tid);
      spwn.kill();
      reject(err);
    });

    spwn.on("exit", (exitCode) => {
      clearTimeout(tid);
      if (exitCode === 0) {
        resolve();
      } else {
        reject(new Error("Command exited with a non-zero exit code"));
      }
    });
  });
}

const isGitHubAction = process.env["GITHUB_ACTIONS"] === "true";
if (isGitHubAction) {
  console.log("Running in CI: Applying specialized build logic...");
} else {
  console.log("Running locally: Using standard developer settings.");
}
/**
 * Shared node logy config options
 * @type {Partial<import("node-logy").LoggerOptions>}
 */
export const nodeLogyOptions = {
  saveToLogFiles: !isGitHubAction,
  showCallSite: true,
};
