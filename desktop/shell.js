const pty = require("node-pty");
const os = require("os");
const crypto = require("crypto")

/**
 * @type {Map<string, import("node-pty").IPty>}
 */
const shellStore = new Map();

/**
 * Kills a spawned shell process. Returns a promise that resolves on success or rejects on failure.
 * @param {import("node-pty").IPty} shellProcess - The shell process to kill
 * @returns {Promise<void>}
 */
function killShell(shellProcess) {
  return new Promise((resolve, reject) => {
    if (!shellProcess) {
      console.warn("Shell process does not exist.");
      return resolve();
    }

    try {
      shellProcess.kill();
      resolve();
    } catch (err) {
      console.error(`Failed to kill shell with PID ${shellProcess.pid}:`, err);
      reject(err);
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

  const shellProcess = pty.spawn(shell, [], {
    cwd: dir,
    env: process.env,
    name: "xterm-color",
    cols: 80,
    rows: 30,
  });

  const id = crypto.randomUUID();
  shellStore.set(id, shellProcess);

  shellProcess.onData((data) => {
    /** @type {shellChangeData} */
    let shellData = {
      chunk: data,
      id,
    };

    _event.sender.send("shell:change", shellData);
  });

  shellProcess.onExit(({ exitCode, signal }) => {
    /** @type {shellCloseData} */
    let shellCloseData = {
      code: exitCode,
      signal,
      id,
    };
    shellStore.delete(id);

    _event.sender.send("shell:close", shellCloseData);
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

  shell.write(cmd + os.EOL);
  return true;
};

/** @type {killShellById} */
const killShellById = async (_event = undefined, shellId) => {
  const shell = shellStore.get(shellId);
  if (!shell) return false;

  try {
    await killShell(shell);
    shellStore.delete(shellId); // Ensure it's removed from store after killing
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

  shell.write("\x03"); // SIGINT (Ctrl+C)
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
