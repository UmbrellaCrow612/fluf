const { spawn } = require("node:child_process");

/**
 * @param {string} cmd
 * @param {string[]} [args]
 * @param {import("node:child_process").SpawnOptions} [options]
 * @returns {Promise<void>}
 */
function runCmd(cmd, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    /** @type {import("node:child_process").ChildProcess} */
    const child = spawn(cmd, args, {
      stdio: "inherit",
      shell: true,
      ...options,
    });

    child.on("close", (exitCode) => {
      const code = exitCode ?? 1;
      code !== 0
        ? reject(new Error(`Command failed with exit code ${code}`))
        : resolve();
    });

    child.on("error", (err) => {
      reject(new Error(`Failed to spawn: ${err.message}`));
    });
  });
}

module.exports = { runCmd };
