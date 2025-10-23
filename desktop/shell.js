const pty = require("node-pty");
const os = require("os");
const crypto = require("crypto");

/**
 * List of shell id's and there shell
 * @type {Map<string, import("node-pty").IPty>}
 */
const shellStore = new Map();

/**
 * List of shells and there list of disposals
 * @type {Map<string, import("node-pty").IDisposable[]>}
 */
const shellDisposes = new Map();

/**
 * Kill all currently active shells.
 */
const cleanUpShells = () => {
  Array.from(shellStore.entries()).forEach(([id, shell]) => {
    shell.write("exit" + os.EOL);
    shellStore.delete(id);
    shellDisposes.get(id)?.forEach((d) => d.dispose());
    shellDisposes.delete(id);

    shell.kill();

    console.log("Clean up shell " + id)
  });
};

/** @type {createShell} */
const createShellImpl = async (_event = undefined, dir) => {
  const shell = os.platform() === "win32" ? "powershell.exe" : "bash";

  /** @type {import("node-pty").IDisposable[]} */
  let disposes = [];

  const shellProcess = pty.spawn(shell, [], {
    cwd: dir,
    env: process.env,
    name: "xterm-color",
    cols: 80,
    rows: 30,
  });

  const id = crypto.randomUUID();
  shellStore.set(id, shellProcess);

  disposes.push(
    shellProcess.onData((data) => {
      /** @type {shellChangeData} */
      let shellData = {
        chunk: data,
        id,
      };

      _event.sender.send("shell:change", shellData);
    })
  );

  shellDisposes.set(id, disposes);

  return { id, shell, history: [] };
};

/** @type {runCmdsInShell} */
const runCommandInShellImpl = async (_event, shellId, cmd) => {
  const shell = shellStore.get(shellId);
  if (!shell) {
    return false;
  }

  shell.write(cmd + os.EOL);
  return true;
};

/** @type {killShellById} */
const killShellById = async (_event = undefined, shellId) => {
  const shell = shellStore.get(shellId);
  if (!shell) return false;

  shell.write("exit" + os.EOL);

  await new Promise((r) => setTimeout(r, 300));

  shell.kill();

  shellStore.delete(shellId);
  shellDisposes.get(shellId)?.forEach((d) => d.dispose());
  shellDisposes.delete(shellId);

  console.log(`Gracefully killed shell ${shellId}`);
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
