/**
 * Contains all rip grep related code
 */

import fs from "fs";
import { spawn } from "child_process";
import binmanResolve from "umbr-binman";
import type {
  CombinedCallback,
  IpcMainInvokeEventCallback,
  ripgrepArgsOptions,
  ripGrepResult,
  ripgrepSearch,
} from "./type.js";
import type { IpcMain } from "electron";
import { binPath } from "./packing.js";

/**
 * Parses ripgrep --vimgrep stdout and converts it to structured objects
 * @param {string} stdout - Full stdout returned by ripgrep (with --vimgrep)
 * @param {string} searchTerm - The search term
 * @returns {import("./type").ripGrepResult[]} Array of structured results
 */
function parseRipgrepOutput(
  stdout: string,
  searchTerm: string,
): ripGrepResult[] {
  /**
   * Contains the file path i.e file and the ripgrep result for it
   * @type {Map<string, import("./type").ripGrepResult>}
   */
  const map: Map<string, ripGrepResult> = new Map();

  const lines = stdout.split(/\r?\n/);
  const lineRegex = /^(.+?):(\d+):(\d+):(.*)$/; // file:line:column:text

  for (const line of lines) {
    if (!line.trim()) continue;

    const match = lineRegex.exec(line);
    if (!match) continue;

    const [, filePath, lineNumberStr, , content] = match;
    const lineNumber = parseInt(lineNumberStr!, 10);

    // Initialize entry for this file
    if (!map.has(filePath!)) {
      const parts = filePath!.split(/[/\\]/);
      const fileName = parts.pop();
      const directoryName = parts.pop() || "";
      map.set(filePath!, {
        filePath: filePath ?? "",
        directoryName,
        lines: [],
        fileName: fileName ?? "",
      });
    }

    // Extract before, match, after for the found term
    const regex = new RegExp(searchTerm, "i");
    const found = regex.exec(content!);
    if (!found) continue;

    const before = content!.slice(0, found.index);
    const matchText = found[0];
    const after = content!.slice(found.index + matchText.length);

    // @ts-ignore
    map.get(filePath).lines.push({
      before,
      match: matchText,
      after,
      linenumber: lineNumber,
    });
  }

  return Array.from(map.values());
}

/**
 * Builds an array of arguments to pass to ripgrep based on options
 * @param {import("./type").ripgrepArgsOptions} options
 * @returns {string[]} Array of arguments for ripgrep
 */
function buildRipgrepArgs(options: ripgrepArgsOptions): string[] {
  if (!options || !options.searchTerm || !options.searchPath) {
    throw new Error("Both searchTerm and searchPath are required.");
  }

  const args = [];

  // Add hidden files flag
  if (options.hidden) {
    args.push("--hidden");
  }

  // Add ignore files flag
  if (options.noIgnore) {
    args.push("--no-ignore");
  }

  // Case insensitive search
  if (options.caseInsensitive) {
    args.push("-i");
  }

  // Include patterns
  if (options.includes) {
    const includePatterns = options.includes.split(",");
    includePatterns.forEach((pattern) => {
      if (pattern.trim()) args.push("--glob", pattern.trim());
    });
  }

  // Exclude patterns
  if (options.excludes) {
    const excludePatterns = options.excludes.split(",");
    excludePatterns.forEach((pattern) => {
      if (pattern.trim()) args.push("--glob", "!" + pattern.trim());
    });
  }

  // Search term
  args.push(options.searchTerm);

  // Search path
  args.push(options.searchPath);

  args.unshift("--vimgrep");

  console.log("args " + args);
  return args;
}

/**
 * Search with ripgrep
 * @param {import("./type").ripgrepArgsOptions} options
 * @returns {Promise<import("./type").ripGrepResult[]>}
 */
async function searchWithRipGrep(
  options: ripgrepArgsOptions,
): Promise<ripGrepResult[]> {
  let bpath = binPath();
  const ripGrepPath = await binmanResolve("ripgrep", ["rg"], bpath);

  if (!ripGrepPath) throw new Error("Ripgrep path is undefined");
  if (!fs.existsSync(options.searchPath))
    throw new Error("Search path does not exist");

  const args = buildRipgrepArgs(options);

  return new Promise((resolve, reject) => {
    const ripGrep = spawn(ripGrepPath, args);

    let stdout = "";
    let stderr = "";

    const timeoutId = setTimeout(() => {
      ripGrep.kill();
      reject(new Error("Ripgrep took to longer than 12 seconds to complete"));
    }, 12000);

    ripGrep.stdout.on("data", (data) => (stdout += data.toString()));
    ripGrep.stderr.on("data", (data) => (stderr += data.toString()));

    ripGrep.on("close", (code) => {
      if (code === 0 || code === 1) {
        clearTimeout(timeoutId);
        const data = parseRipgrepOutput(stdout, options.searchTerm);
        resolve(data);
      } else {
        clearTimeout(timeoutId);
        reject(new Error(`Ripgrep exited with code ${code}: ${stderr}`));
      }
    });
  });
}

/**
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").ripgrepSearch>}
 */
const searchImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  ripgrepSearch
> = async (_, options) => {
  return await searchWithRipGrep(options);
};

/**
 * Register ripgrep listeners
 * @param {import("electron").IpcMain} ipcMain
 */
export const registerRipgrepListeners = (ipcMain: IpcMain) => {
  ipcMain.handle("ripgrep:search", searchImpl);
};
