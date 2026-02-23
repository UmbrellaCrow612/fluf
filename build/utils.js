import { Logger } from "node-logy";
import { spawn } from "node:child_process";

/**
 * Safely run a peice of logic if fails then it will exit and perform cleanup needed
 * @param {() => Promise<void> | void} callback The logic to run
 * @param {Logger} logger - Logger instace
 * @param {string} errMessage - Message to show on failure
 * @returns {Promise<void>}
 */
export async function safeRun(callback, logger, errMessage) {
  try {
    await callback();
  } catch (error) {
    logger.error(errMessage, error);
    safeExit(logger, 1);
  }
}

/**
 * Safely shutdown logger so it does not hang the process and exit
 * @param {Logger} logger - The logger instace
 * @param {1 | 0} code - The exit code, zero is no err 1 is err
 * @returns {Promise<void>}
 */
export async function safeExit(logger, code) {
  await logger.flush();
  await logger.shutdown();
  process.exit(code);
}

/**
 * Run a given command and wait for it to finish
 * @param {string} command - The commanbd to spawn
 * @param {string[]} args - Addtional arguments to pass to it
 * @param {import("node:child_process").SpawnOptionsWithoutStdio} options
 * @param {number} timeout - How long in seconds to wait beofre rejecting it in `seconds`
 * @returns {Promise<void>}
 */
export function runCommand(command, args, options, timeout) {
  return new Promise((resolve, reject) => {
    let spwn = spawn(command, args, {
      stdio: "inherit",
      shell: true,
      ...options,
    });
    const tid = setTimeout(() => {
      spwn.kill();
      reject(new Error("Command timeout out and took to long to exit"));
    }, timeout * 1000);

    spwn.on("error", (err) => {
      clearTimeout(tid);
      spwn.kill();
      reject(
        new Error(
          "Spawned command invalid: " +
            err.message +
            err.cause +
            err.name +
            err.stack,
        ),
      );
    });

    spwn.on("exit", (exitCode) => {
      clearTimeout(tid);
      if (exitCode === 0) {
        resolve();
      } else {
        reject(new Error("Command exited with error code"));
      }
    });
  });
}
