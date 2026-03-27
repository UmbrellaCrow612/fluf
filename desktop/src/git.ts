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

function toDateTimeString(unixSeconds: number, tzOffset: string): string {
  // Parse the offset string "+0100" or "-0500"
  const sign = tzOffset[0] === "+" ? 1 : -1;
  const hours = parseInt(tzOffset.slice(1, 3), 10);
  const minutes = parseInt(tzOffset.slice(3, 5), 10);
  const offsetMs = sign * (hours * 60 + minutes) * 60 * 1000;

  // Apply offset to get local time as a UTC date
  const localDate = new Date(unixSeconds * 1000 + offsetMs);

  // Format using UTC methods (since we've already baked in the offset)
  const pad = (n: number) => String(n).padStart(2, "0");

  const year = localDate.getUTCFullYear();
  const month = pad(localDate.getUTCMonth() + 1);
  const day = pad(localDate.getUTCDate());
  const hour = pad(localDate.getUTCHours());
  const minute = pad(localDate.getUTCMinutes());
  const second = pad(localDate.getUTCSeconds());

  return `${year}-${month}-${day} ${hour}:${minute}:${second} ${tzOffset}`;
}

/**
 * Information given to you about running of the git command
 */
type gitCommandContext = {
  /**
   * The stdout parsed
   */
  stdout: string;

  /**
   * The stderror parsed
   */
  stderror: string;

  /**
   * Exit code
   */
  code: number | null;

  /**
   * Promise reject
   */
  reject: (reason: unknown) => void;

  /**
   * Promise resolve
   */
  resolve: (stdout: string) => void;
};

/**
 * Provide custom logic when the process exits and perform logic, Note you must resolve or reject the promise.
 */
type onGitCommandExit = (context: gitCommandContext) => void;

/**
 * Parses git blame stdout into structured information assumes `--porcelain` was passed
 * @param stdout - The raw output from git blame command
 * @returns Parsed blame information or null if parsing fails
 */
export function parseGitBlameLine(
  stdout: string,
): gitBlameLineInformation | null {
  try {
    if (!stdout || !stdout.trim()) {
      return null;
    }

    const authorMatch = stdout.match(/(?<=author )[^\n]*/);
    if (!authorMatch || !authorMatch[0]) {
      throw new Error("Could not match author");
    }

    const commitMatch = stdout.match(/^\S+/);
    if (!commitMatch || !commitMatch[0]) {
      throw new Error("Could not match commit");
    }

    const timeMatch = stdout.match(/committer-time\s+(\d+)/);
    if (!timeMatch || !timeMatch[0]) {
      throw new Error("Could not match time");
    }

    const timeTzMatch = stdout.match(/committer-tz\s+([+-]\d+)/);
    if (!timeTzMatch || !timeTzMatch[0]) {
      throw new Error("Could not match time zone");
    }

    const datetime = toDateTimeString(Number(timeMatch[0]), timeTzMatch[0]);

    return {
      author: authorMatch[0],
      commit: commitMatch[0].slice(0, 8),
      dateTime: datetime,
    };
  } catch (error) {
    logger.error("Failed to parse git stdout ", error);
    return null;
  }
}

/**
 * Run git command
 * @param directory The directory to run the cmds in
 * @param flags Addtional git commands and flags
 * @param [onExit=null] Custom logic you want to perform on exit instead of the default behvaiour
 * @returns Stdout of the git process
 */
function runGitCommand(
  directory: string,
  flags: string[],
  onExit: onGitCommandExit | null = null,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("Git process hanged"));
    }, 5000);

    try {
      const process = spawn("git", flags, { cwd: directory });
      let stdout = "";
      let stderror = "";

      const context: gitCommandContext = {
        resolve,
        reject,
        get stdout() {
          return stdout;
        },
        get stderror() {
          return stderror;
        },
        code: null,
      };

      process.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      process.stderr.on("data", (chunk: Buffer) => {
        stderror += chunk.toString();
      });

      process.on("error", (err) => {
        logger.error("Git process failed to spawn ", err);
        clearTimeout(timeoutId);
        reject(err);
      });

      process.on("exit", (code) => {
        clearTimeout(timeoutId);
        context.code = code;

        if (onExit) {
          onExit(context);
          return;
        }

        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error("Git process exited with non zero code"));
        }
      });
    } catch (error) {
      logger.error("Failed to run git commands ", flags);
      clearTimeout(timeoutId);
      reject(error as Error);
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

    const stdout = await runGitCommand(
      directory,
      [
        "blame",
        "-L",
        `${String(start)},${String(end)}`,
        filePath,
        "--porcelain",
      ],
      (ctx) => {
        if (ctx.code === 0) {
          ctx.resolve(ctx.stdout);
        } else {
          if (ctx.code === 128) {
            ctx.resolve(""); // we do this as if they request blame on lines that dont exist it throws error this way to just returns null git emitts 128 code
          } else {
            ctx.reject(new Error("Git blame exited with non zero code"));
          }
        }
      },
    );

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
