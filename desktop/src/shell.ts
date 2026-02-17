/*
 * Contains all the code needed to have pty / shell support like vscode terminal
 */
import os from "os";
import fs from "fs/promises";
import {
  spawn,
  type IDisposable,
  type IPty,
} from "@homebridge/node-pty-prebuilt-multiarch";
import path from "path";
import type {
  CombinedCallback,
  createShell,
  IpcMainInvokeEventCallback,
  killShell,
  resizeShell,
  writeToShell,
} from "./type.js";
import { logger } from "./logger.js";
import { broadcastToAll } from "./broadcast.js";
import type { TypedIpcMain } from "./typed-ipc.js";

/**
 * Contains a map of shell PID and then the proccess
 */
const shells: Map<number, IPty> = new Map<number, IPty>();

/**
 * Contains a list of specific shell PID's and there dipose methods
 */
const shellDisposes: Map<number, IDisposable[]> = new Map<
  number,
  IDisposable[]
>();

/**
 * Spawn specific shell based on platform
 * */
const shell = os.platform() === "win32" ? "powershell.exe" : "bash";

const createImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  createShell
> = async (_, directory) => {
  /** Return -1 for error's */
  const err = -1;

  try {
    if (!directory) {
      logger.error("Directory not passed for shell");
      return err;
    }

    await fs.access(path.normalize(directory));

    const pty = spawn(shell, [], {
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
    const disposes: IDisposable[] = [];

    disposes.push(
      pty.onData((chunk) => {
        broadcastToAll("shell:change", pty.pid, chunk);
      }),
    );

    disposes.push(
      pty.onExit((exit) => {
        broadcastToAll("shell:exit", pty.pid, exit);

        const shell = shells.get(pty.pid);
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

const killImpl: CombinedCallback<IpcMainInvokeEventCallback, killShell> = (
  _,
  pid,
) => {
  try {
    const shell = shells.get(pid);
    if (!shell) return Promise.resolve(false);

    const disposes = shellDisposes.get(pid);
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

const resizeImpl: CombinedCallback<IpcMainInvokeEventCallback, resizeShell> = (
  _,
  pid,
  col,
  row,
) => {
  try {
    const shell = shells.get(pid);
    if (!shell) return;

    shell.resize(col, row);
  } catch (error) {
    logger.error("Failed to resize shell ", error);

    throw error;
  }
};

const writeImpl: CombinedCallback<IpcMainInvokeEventCallback, writeToShell> = (
  _,
  pid,
  content,
) => {
  const shell = shells.get(pid);
  if (!shell) return;

  shell.write(content);
};

/**
 * Kills shells
 */
export const cleanUpShells = () => {
  const a = Array.from(shells.values());
  const b = Array.from(shellDisposes.values());

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

/**
 * All events for shell operations
 */
export interface ShellEvents {
  "shell:create": {
    args: [directory: string];
    return: number;
  };

  "shell:kill": {
    args: [pid: number];
    return: Promise<boolean>;
  };

  "shell:resize": {
    args: [pid: number, col: number, row: number];
    return: void;
  };

  "shell:write": {
    args: [pid: number, content: string];
    return: Promise<boolean>;
  };

  "shell:change": {
    args: [pid: number, chunk: string];
    return: void;
  };

  "shell:exit": {
    args: [pid: number, exit: { exitCode: number; signal?: number }];
    return: void;
  };
}

/**
 * Add all event listener
 */
export const registerShellListeners = (typedIpcMain: TypedIpcMain) => {
  typedIpcMain.handle("shell:create", createImpl);
  typedIpcMain.handle("shell:kill", killImpl);
  typedIpcMain.on("shell:resize", resizeImpl);
  typedIpcMain.on("shell:write", writeImpl);
};
