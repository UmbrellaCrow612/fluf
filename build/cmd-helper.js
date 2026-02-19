const { spawn } = require("node:child_process");

/**
 * Executes a command with arguments in an async pattern
 * @param {string} cmd - The command to execute
 * @param {string[]} args - Array of arguments for the command
 * @param {object} options - Optional spawn options (cwd, env, etc.)
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number}>}
 */
function runCmd(cmd, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: "inherit",
      shell: true,
      ...options,
    });

    let stdout = "";
    let stderr = "";

    // Collect stdout data
    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    // Collect stderr data
    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    // Handle process completion
    child.on("close", (exitCode) => {
      if (!exitCode) exitCode = 1;
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode,
      });
    });

    // Handle process errors (spawn failures)
    child.on("error", (error) => {
      reject(new Error(`Failed to spawn process: ${error.message}`));
    });
  });
}

module.exports = { runCmd };
