/**
 * Contains all api code for interacting with git via electron
 */

import { spawn } from "child_process";
import path from "node:path";
import type {
  CombinedCallback,
  gitBlameLine,
  gitBlameLineInformation,
  gitCurrentBranch,
  hasGit,
  IpcMainInvokeEventCallback,
} from "./type.js";
import { logger } from "./logger.js";
import type { TypedIpcMain } from "./typed-ipc.js";

/**
 * Parses git blame stdout into structured information
 * @param stdout - The raw output from git blame command
 * @returns Parsed blame information or null if parsing fails
 *
 * @example
 * parseGitBlameLine(`00000000 (Not Committed Yet 2026-03-25 12:07:23 +0000 500)   content: string;`)
 * // Returns: { commit: "00000000", author: "Not Committed Yet", dateTime: "2026-03-25 12:07:23 +0000", content: "  content: string;" }
 *
 * parseGitBlameLine(`0cfd9080 (Yousaf Wazir 2026-02-17 17:18:00 +0000 550)    * - The folder to look in`)
 * // Returns: { commit: "0cfd9080", author: "Yousaf Wazir", dateTime: "2026-02-17 17:18:00 +0000", content: "   * - The folder to look in" }
 */
export function parseGitBlameLine(
  stdout: string,
): gitBlameLineInformation | null {
  if (!stdout || !stdout.trim()) {
    return null;
  }

  // Normalize line endings and trim
  const line = stdout.trim().replace(/\r\n/g, "\n").split("\n")[0];

  if (!line) {
    return null;
  }

  // Git blame format: <commit> (<author> <date> <time> <timezone> <line-number>) <content>
  const blameRegex =
    /^([0-9a-f]{8,40})\s+\((.+?)\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\s+[+-]\d{4})\s+\d+\)\s(.*)$/;

  const match = line.match(blameRegex);

  if (!match) {
    return null;
  }

  const [, commit, author, dateTime, content] = match;

  return {
    commit: commit as "00000000" | string,
    author: author!.trim() as "Not Committed Yet" | string,
    dateTime: dateTime as string,
    content: content as string,
  };
}

/**
 * Run git command
 * @param directory The directory to run the cmds in
 * @param flags Addtional git commands and flags
 * @returns Stdout of the git process
 */
function runGitCommand(directory: string, flags: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("Git process hanged"));
    }, 5000);

    try {
      const process = spawn("git", flags, { cwd: directory });
      let stdout = "";

      process.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });

      process.on("error", (err) => {
        logger.error("Git process failed to spawn ", err);
        clearTimeout(timeoutId);
        reject(err);
      });

      process.on("exit", (code) => {
        clearTimeout(timeoutId);

        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error("Git process exited with non zero code"));
        }
      });
    } catch (error) {
      logger.error("Failed to run git commands ", flags);
      clearTimeout(timeoutId);
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

const gitBlameLineImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  gitBlameLine
> = async (_, dir, fp, start, end) => {
  try {
    const directory = path.resolve(path.normalize(dir));
    const filePath = path.resolve(path.normalize(fp));

    const stdout = await runGitCommand(directory, [
      "blame",
      "-L",
      `${start},${end}`,
      filePath,
    ]);

    return parseGitBlameLine(stdout);
  } catch (error) {
    logger.error(
      "Failed to get git blame information ",
      dir,
      fp,
      start,
      end,
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
  "git:blame:line": {
    args: [directory: string, filePath: string, start: number, end: number];
    return: gitBlameLineInformation | null;
  };
}

/**
 * Registers all listeners and handlers for git
 */
export const registerGitListeners = (typedIpcMain: TypedIpcMain) => {
  typedIpcMain.handle("has:git", hasGitImpl);
  typedIpcMain.handle("git:current:branch", gitCurrentBranchImpl);
  typedIpcMain.handle("git:blame:line", gitBlameLineImpl);
};
