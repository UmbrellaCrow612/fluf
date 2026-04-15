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
  getShellInformation,
  getShellSpawnExecutables,
  IpcMainInvokeEventCallback,
  isShellAlive,
  killShell,
  resizeShell,
  shellExecutableInformation,
  shellInformation,
  writeToShell,
} from "./type.js";
import { logger } from "./logger.js";
import { broadcastToAll } from "./broadcast.js";
import type { TypedIpcMain } from "./typed-ipc.js";

/**
 * Contains a map of shell PID and then the proccess pty
 */
const shellPtys: Map<number, IPty> = new Map<number, IPty>();
/**
 * Contains shell pid and it's information
 */
const shellInformations: Map<number, shellInformation> = new Map();

/**
 * Contains a list of specific shell PID's and there dipose methods
 */
const shellDisposes: Map<number, IDisposable[]> = new Map<
  number,
  IDisposable[]
>();

/**
 * Default exe to spawn specific shell based on platform
 * */
const defaultExecutable = os.platform() === "win32" ? "powershell.exe" : "bash";

/**
 * Well-known shells by platform.
 * Keys are the bare executable name (no extension); values are the display name.
 */
const KNOWN_SHELLS = {
  // Unix-like
  bash: "Bash",
  zsh: "Zsh",
  fish: "Fish",
  sh: "Sh",
  dash: "Dash",
  ksh: "KornShell",
  csh: "C Shell",
  tcsh: "TC Shell",
  nu: "Nushell",
  xonsh: "Xonsh",

  // Windows
  powershell: "Windows PowerShell",
  pwsh: "PowerShell",
  cmd: "Command Prompt",
  wsl: "WSL",
  wsl2: "WSL 2",
  ubuntu: "Ubuntu (WSL)",
  debian: "Debian (WSL)",
  kali: "Kali Linux (WSL)",
  "git-bash": "Git Bash",
} as const;

async function resolveExecutable(
  dir: string,
  baseName: string,
): Promise<string | null> {
  const candidates =
    process.platform === "win32"
      ? [`${baseName}.exe`, `${baseName}.cmd`, `${baseName}.bat`]
      : [baseName];

  for (const candidate of candidates) {
    const full = path.join(dir, candidate);
    try {
      await fs.access(full, fs.constants.X_OK);
      const stat = await fs.stat(full);
      if (stat.isFile()) return full;
    } catch {
      // not found / not executable
    }
  }
  return null;
}

export const getShellSpawnExecutablesImpl: getShellSpawnExecutables =
  async () => {
    const delimiter = process.platform === "win32" ? ";" : ":";
    const pathDirs = (process.env["PATH"] ?? "")
      .split(delimiter)
      .filter(Boolean);

    const results: shellExecutableInformation[] = [];
    const seen = new Set<string>();

    for (const [baseName, displayName] of Object.entries(KNOWN_SHELLS)) {
      for (const dir of pathDirs) {
        const resolved = await resolveExecutable(dir, baseName);
        if (!resolved || seen.has(resolved)) continue;
        seen.add(resolved);
        results.push({ name: displayName, path: resolved });
        break; // first match on PATH wins, like which/where
      }
    }

    return results;
  };

const createImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  createShell
> = async (_, directory, executable, args) => {
  try {
    if (!directory) {
      logger.error("Directory not passed for shell");
      return null;
    }

    const norm = path.normalize(directory);

    await fs.access(norm);

    let exeToSpawn: string | undefined = undefined;
    if (typeof executable === "string") {
      await fs.access(path.resolve(path.normalize(executable)));
      exeToSpawn = executable;
    } else {
      exeToSpawn = defaultExecutable;
    }

    let exeArgsToSpawn: string[] | undefined = undefined;
    if (Array.isArray(args)) {
      exeArgsToSpawn = args;
    } else {
      exeArgsToSpawn = [];
    }

    const pty = spawn(exeToSpawn, exeArgsToSpawn, {
      name: "xterm-color",
      cols: 80,
      rows: 30,
      cwd: norm,
      env: process.env,
    });

    shellPtys.set(pty.pid, pty);
    const shellInfo: shellInformation = {
      args: exeArgsToSpawn,
      cols: pty.cols,
      executable: exeToSpawn,
      pid: pty.pid,
      rows: pty.rows,
      title: path.basename(exeToSpawn),
    };
    shellInformations.set(pty.pid, shellInfo);

    /**
     * Contains all disposes for this pty
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

        const shell = shellPtys.get(pty.pid);
        shellDisposes.get(pty.pid)?.forEach((x) => {
          x.dispose();
        });
        shellDisposes.delete(pty.pid);

        shell?.kill();
        shellPtys.delete(pty.pid);
      }),
    );

    shellDisposes.set(pty.pid, disposes);

    return shellInfo;
  } catch (error) {
    logger.error("Create shell failed ", error, " Directory path ", directory);
    return null;
  }
};

const killImpl: CombinedCallback<IpcMainInvokeEventCallback, killShell> = (
  _,
  pid,
) => {
  try {
    const shell = shellPtys.get(pid);
    if (!shell) return Promise.resolve(false);

    const disposes = shellDisposes.get(pid);
    if (!disposes) return Promise.resolve(false);

    shell.write("exit" + "\n");

    disposes.forEach((x) => {
      x.dispose();
    });

    shell.kill();

    shellPtys.delete(pid);
    shellDisposes.delete(pid);
    shellInformations.delete(pid);
    return Promise.resolve(true);
  } catch (error) {
    logger.error("Failed to kill shell ", error);
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
    const shell = shellPtys.get(pid);
    const info = shellInformations.get(pid);
    if (!shell || !info) {
      logger.error("Could not resize shell pid ", pid);
      return;
    }

    shell.resize(col, row);
    shellInformations.set(pid, { ...info, cols: col, rows: row });
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
  const shell = shellPtys.get(pid);
  if (!shell) return;

  shell.write(content);
};

const shellAliveImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  isShellAlive
> = (_, pid) => {
  try {
    const shell = shellPtys.get(pid);
    if (!shell) return Promise.resolve(false);

    // Check if process is still running by sending signal 0
    process.kill(pid, 0);
    return Promise.resolve(true);
  } catch (error) {
    logger.error("Failed to check if shell is alive pid: ", pid, error);
    return Promise.resolve(false);
  }
};

const shellInformationImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  getShellInformation
> = (_, pid) => {
  try {
    const shell = shellPtys.get(pid);
    const info = shellInformations.get(pid);

    if (!shell || !info) {
      throw new Error(`Shell with PID ${String(pid)} not found`);
    }

    return Promise.resolve(info);
  } catch (error) {
    logger.error("Failed to get shell information for pid: ", pid, error);
    throw error;
  }
};

/**
 * Kills shells
 */
export const cleanUpShells = () => {
  const a = Array.from(shellPtys.values());
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
    logger.info("Killed shell ", x.pid);
    x.kill();
  });
};

/**
 * All events for shell operations
 */
export interface ShellEvents {
  "shell:create": {
    args: [directory: string, executable?: string, args?: string[]];
    return: shellInformation | null;
  };

  "shell:kill": {
    args: [pid: number];
    return: Promise<boolean>;
  };

  "shell:resize": {
    args: [pid: number, col: number, row: number];
    return: unknown;
  };

  "shell:write": {
    args: [pid: number, content: string];
    return: Promise<boolean>;
  };

  "shell:change": {
    args: [pid: number, chunk: string];
    return: unknown;
  };

  "shell:exit": {
    args: [pid: number, exit: { exitCode: number; signal?: number }];
    return: unknown;
  };

  "shell:is:alive": {
    args: [pid: number];
    return: boolean;
  };

  "shell:information": {
    args: [pid: number];
    return: shellInformation;
  };

  "shell:executables": {
    args: [];
    return: shellExecutableInformation[];
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
  typedIpcMain.handle("shell:is:alive", shellAliveImpl);
  typedIpcMain.handle("shell:information", shellInformationImpl);
  typedIpcMain.handle("shell:executables", getShellSpawnExecutablesImpl);
};
