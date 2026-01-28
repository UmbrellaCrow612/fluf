/*
 * Contains all the code needed to have pty / shell support like vscode terminal
 */
const os = require("os");
const fs = require("fs/promises");
const { spawn } = require("@homebridge/node-pty-prebuilt-multiarch");
const path = require("path");
const { logger } = require("./logger");
const { broadcastToAll } = require("./broadcast");

/**
 * Contains a map of shell PID and then the proccess
 * @type {Map<number, import("@homebridge/node-pty-prebuilt-multiarch").IPty>}
 */
const shells = new Map();

/**
 * Contains a list of specific shell PID's and there dipose methods
 * @type {Map<number, import("@homebridge/node-pty-prebuilt-multiarch").IDisposable[]>}
 */
const shellDisposes = new Map();

/** Spawn specific shell based on platform  */
const shell = os.platform() === "win32" ? "powershell.exe" : "bash";

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").createShell>}
 */
const createImpl = async (_, directory) => {
  /** Return -1 for error's */
  let err = -1;

  try {
    if (!directory) {
      logger.error("Directory not passed for shell");
      return err;
    }

    await fs.access(path.normalize(directory));

    let pty = spawn(shell, [], {
      name: "xterm-color",
      cols: 80,
      rows: 30,
      cwd: directory,
      env: process.env,
    });

    shells.set(pty.pid, pty);

    /**
     * Contains all disposes for this pty
     * @type {import("@homebridge/node-pty-prebuilt-multiarch").IDisposable[]}
     */
    let disposes = [];

    disposes.push(
      pty.onData((chunk) => {
        broadcastToAll("shell:change", pty.pid, chunk);
      }),
    );

    disposes.push(
      pty.onExit((exit) => {
        broadcastToAll("shell:exit", pty.pid, exit);

        let shell = shells.get(pty.pid);
        shellDisposes.get(pty.pid)?.forEach((x) => x.dispose());
        shellDisposes.delete(pty.pid);

        shell?.kill();
        shells.delete(pty.pid);
      }),
    );

    shellDisposes.set(pty.pid, disposes);

    return pty.pid;
  } catch (error) {
    logger.error(
      "Create shell failed " +
        JSON.stringify(error) +
        " Directory path " +
        directory,
    );
    return err;
  }
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").killShell>}
 */
const killImpl = (_, pid) => {
  try {
    let shell = shells.get(pid);
    if (!shell) return Promise.resolve(false);

    let disposes = shellDisposes.get(pid);
    if (!disposes) return Promise.resolve(false);

    shell.write("exit" + "\n");

    disposes.forEach((x) => x.dispose());

    shell.kill();

    shells.delete(pid);
    shellDisposes.delete(pid);
    return Promise.resolve(true);
  } catch (error) {
    logger.error("Failed to kill shell " + JSON.stringify(error));
    return Promise.resolve(false);
  }
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").resizeShell>}
 */
const resizeImpl = (_, pid, col, row) => {
  try {
    let shell = shells.get(pid);
    if (!shell) return Promise.resolve(false);

    shell.resize(col, row);

    return Promise.resolve(true);
  } catch (error) {
    logger.error("Failed to resize shell " + JSON.stringify(error));
    return Promise.resolve(false);
  }
};

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").writeToShell>}
 */
const writeImpl = (_, pid, content) => {
  let shell = shells.get(pid);
  if (!shell) return;

  shell.write(content);
};

/**
 * Add all event listener
 * @param {import("electron").IpcMain} ipcMain\
 */
const registerShellListeners = (ipcMain) => {
  ipcMain.handle("shell:create", createImpl);
  ipcMain.handle("shell:kill", killImpl);
  ipcMain.handle("shell:resize", resizeImpl);
  ipcMain.on("shell:write", writeImpl);
};

/**
 * Kills shells
 */
const cleanUpShells = () => {
  let a = Array.from(shells.values());
  let b = Array.from(shellDisposes.values());

  b.forEach((x) => {
    x.forEach((y) => {
      y.dispose();
    });
  });

  a.forEach((x) => {
    x.write("exit" + "\n");
  });

  a.forEach((x) => {
    logger.info("Killed shell " + x.pid);
    x.kill();
  });
};

module.exports = { registerShellListeners, cleanUpShells };
