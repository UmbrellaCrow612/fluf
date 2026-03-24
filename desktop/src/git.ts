/**
 * Contains all api code for interacting with git via electron
 */

import { spawn } from "child_process";
import path from "node:path";
import type {
  CombinedCallback,
  gitCurrentBranch,
  hasGit,
  IpcMainInvokeEventCallback,
} from "./type.js";
import { logger } from "./logger.js";
import type { TypedIpcMain } from "./typed-ipc.js";

/**
 * Run git command
 * @param directory The directory to run the cmds in
 * @param flags Addtional git commands and flags
 * @returns Stdout of the git process
 */
function runGitCommand(directory: string, flags: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const process = spawn("git", flags, { cwd: directory });
      let stdout = "";

      process.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });

      process.on("error", (err) => {
        logger.error("Git process failed to spawn ", err);
        reject(err);
      });

      process.on("exit", (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error("Git process exited with non zero code"));
        }
      });
    } catch (error) {
      logger.error("Failed to run git commands ", flags);
      reject(error);
    }
  });
}

const hasGitImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  hasGit
> = async () => {
  try {
    const basePath = path.resolve("/");
    await runGitCommand(basePath, ["--version"]);
    return true;
  } catch (error) {
    logger.error("System does not have git or run git command failed ", error);
    return false;
  }
};

const gitCurrentBranchImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  gitCurrentBranch
> = async (_, directory) => {
  try {
    const branch = await runGitCommand(directory, [
      "rev-parse",
      "--abbrev-ref",
      "HEAD",
    ]);

    return branch;
  } catch (error) {
    logger.error(
      "Failed to check current git branch for path ",
      directory,
      error,
    );
    return null;
  }
};

/**
 * All git event operations
 */
export interface GitEvents {
  "has:git": {
    args: [];
    return: boolean;
  };
  "git:current:branch": {
    args: [directory: string];
    return: string | null;
  };
}

/**
 * Registers all listeners and handlers for git
 */
export const registerGitListeners = (typedIpcMain: TypedIpcMain) => {
  typedIpcMain.handle("has:git", hasGitImpl);
  typedIpcMain.handle("git:current:branch", gitCurrentBranchImpl);
};
