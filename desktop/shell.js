/*
 * Contains all the code needed to have pty / shell support like vscode terminal
 */
const os = require("os");
const fs = require("fs/promises");
const { spawn } = require("@homebridge/node-pty-prebuilt-multiarch");
const path = require("path");

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

/**
 * Ref to main window to send events
 * @type {import("electron").BrowserWindow | null}
 */
let windowRef = null;

/** Spawn specific shell based on platform  */
const shell = os.platform() === "win32" ? "powershell.exe" : "bash";

/**
 * Add all event listener
 * @param {import("electron").IpcMain} ipcMain\
 * @param {import("electron").BrowserWindow | null} win
 */
const registerShellListeners = (ipcMain, win) => {
  windowRef = win;

  ipcMain.handle(
    // handles create, change and exit
    "shell:create",
    async (_, /** @type {string}*/ directory) => {
      /** Return -1 for error's */
      let err = -1;

      try {
        if (!directory) {
          console.error("Directory not passed for shell");
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
            if (windowRef) {
              windowRef.webContents.send("shell:change", pty.pid, chunk);
            }
          }),
        );

        disposes.push(
          pty.onExit((exit) => {
            if (windowRef) {
              windowRef.webContents.send("shell:exit", pty.pid, exit);

              let shell = shells.get(pty.pid);

              shellDisposes.get(pty.pid)?.forEach((x) => x.dispose());
              shellDisposes.delete(pty.pid);

              shell?.kill();
              shells.delete(pty.pid);
            }
          }),
        );

        shellDisposes.set(pty.pid, disposes);

        return pty.pid;
      } catch (error) {
        console.error(
          "Create shell failed " +
            JSON.stringify(error) +
            " Directory path " +
            directory,
        );
        return err;
      }
    },
  );

  ipcMain.handle("shell:kill", (_, /** @type {number}*/ pid) => {
    try {
      let shell = shells.get(pid);
      if (!shell) return false;

      let disposes = shellDisposes.get(pid);
      if (!disposes) return false;

      shell.write("exit" + "\n");

      disposes.forEach((x) => x.dispose());

      shell.kill();

      shells.delete(pid);
      shellDisposes.delete(pid);
    } catch (error) {
      console.error("Failed to kill shell " + JSON.stringify(error));
      return false;
    }
  });

  ipcMain.handle(
    "shell:resize",
    (
      _,
      /** @type {number}*/ pid,
      /** @type {number}*/ col,
      /** @type {number}*/ row,
    ) => {
      try {
        let shell = shells.get(pid);
        if (!shell) return false;

        shell.resize(col, row);

        return true;
      } catch (error) {
        console.error("Failed to resize shell " + JSON.stringify(error));
        return false;
      }
    },
  );

  ipcMain.on(
    "shell:write",
    (event, /** @type {number}*/ pid, /** @type {string}*/ content) => {
      let shell = shells.get(pid);
      if (!shell) return;

      shell.write(content);
    },
  );
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
    console.log("Killed shell " + x.pid);
    x.kill();
  });
};

module.exports = { registerShellListeners, cleanUpShells };
