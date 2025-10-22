/**
 * Contains api to create shells for terminal to use
 */

const { spawn, exec } = require("child_process");
const os = require("os");

/**
 * @type {Map<string, import("child_process").ChildProcessWithoutNullStreams>}
 */
const shellStore = new Map();

/**
 * Kills a spawned shell process. Returns a promise that resolves on success or rejects on failure.
 * @param {import("child_process").ChildProcess} shellProcess - The shell process to kill
 * @returns {Promise<void>}
 */
function killShell(shellProcess) {
  return new Promise((resolve, reject) => {
    if (!shellProcess || shellProcess.killed) {
      console.warn("Shell process is already killed or does not exist.");
      return resolve();
    }

    if (os.platform() === "win32") {
      // Force kill PowerShell/CMD and all child processes
      exec(`taskkill /pid ${shellProcess.pid} /T /F`, (err, stdout, stderr) => {
        if (err) {
          console.error(
            `Failed to kill shell with PID ${shellProcess.pid}:`,
            stderr
          );
          return reject(err);
        }
        console.log(`Shell killed (taskkill): ${stdout}`);
        resolve();
      });
    } else {
      // Standard POSIX signal handling
      shellProcess.kill("SIGTERM");

      const killTimeout = setTimeout(() => {
        if (!shellProcess.killed) {
          console.log(
            `Shell with PID ${shellProcess.pid} did not exit with SIGTERM, sending SIGKILL.`
          );
          shellProcess.kill("SIGKILL"); // Force kill
        }
      }, 2000);

      shellProcess.on("exit", () => {
        clearTimeout(killTimeout);
        resolve();
      });
    }
  });
}

/**
 * Kill all currently active shells.
 * @returns {Promise<void[]>} A promise that resolves when all kill commands have been issued.
 */
const cleanUpShells = () => {
  const killPromises = Array.from(shellStore.values()).map(killShell);
  shellStore.clear();
  return Promise.all(killPromises);
};

/** @type {createShell} */
const createShellImpl = async (_event = undefined, dir) => {
  const shell = os.platform() === "win32" ? "powershell.exe" : "bash";

  const shellProcess = spawn(shell, [], {
    cwd: dir,
    stdio: "pipe",
  });

  const id = crypto.randomUUID();
  shellStore.set(id, shellProcess);

  shellProcess.stdout.on("data", (data) => {
    /** @type {shellChangeData} */
    let shellData = {
      chunk: data.toString(),
      isError: false,
      id,
    };

    _event.sender.send("shell:change", shellData);
  });

  shellProcess.stderr.on("data", (data) => {
    /** @type {shellChangeData} */
    let shellData = {
      chunk: data.toString(),
      isError: true,
      id,
    };

    _event.sender.send("shell:change", shellData);
  });

  shellProcess.on("close", (code, signal) => {
    /** @type {shellCloseData} */
    let shellCloseData = {
      code,
      signal,
      id,
    };
    shellStore.delete(id);

    _event.sender.send("shell:close", shellCloseData);
  });

  shellProcess.on("error", (err) => {
    /** @type {shellErrorData} */
    let shellErrorData = {
      error: err,
      id,
    };

    shellStore.delete(id);

    _event.sender.send("shell:error", shellErrorData);
  });

  return { id, shell, history: [] };
};

/** @type {runCmdsInShell} */
const runCommandInShellImpl = async (_event, shellId, cmd) => {
  const shell = shellStore.get(shellId);
  if (!shell) {
    console.warn(`Attempted to run command in non-existent shell: ${shellId}`);
    return false;
  }

  shell.stdin.write(cmd + os.EOL);
  return true;
};

/** @type {killShellById} */
const killShellById = async (_event = undefined, shellId) => {
  const shell = shellStore.get(shellId);
  if (!shell) return false;

  try {
    await killShell(shell);
  } catch (error) {
    console.error(`Error while killing shell ${shellId}:`, error);
    shellStore.delete(shellId);
    return false;
  }
  return true;
};

/** @type {stopCmdInShell} */
const stopCommandInShell = async (_event = undefined, shellId) => {
  const shell = shellStore.get(shellId);
  if (!shell) return false;

  shell.stdin.write("\x03"); // SIGINT (Ctrl+C)
  return true;
};

/** @type {isShellActive} */
const isShellActiveImpl = async (_event = undefined, shellId) => {
  return shellStore.has(shellId);
};

module.exports = {
  killShellById,
  runCommandInShellImpl,
  createShellImpl,
  stopCommandInShell,
  isShellActiveImpl,

  cleanUpShells,
};
