/**
 * Contains all the code to interact with fsearch
 */

import fs from "fs";
import { spawn } from "child_process";
import binmanResolve from "umbr-binman";
import type {
  CombinedCallback,
  fsearch,
  fsearchOptions,
  fsearchResult,
  IpcMainInvokeEventCallback,
} from "./type.js";
import { binPath } from "./packing.js";
import type { IpcMain } from "electron";
import type { TypedIpcMain } from "./typed-ipc.js";

/** @type {import("./type").fsearchOptions} */
const defaultSearchOptions: fsearchOptions = {
  directory: ".",
  term: "default",
  count: false,
  debug: false,
  depth: 0,
  excludeDir: [],
  excludeExt: [],
  ext: [],
  hidden: false,
  ignoreCase: true,
  limit: 0,
  lines: 0,
  maxSize: 0,
  minSize: 0,
  modifiedAfter: "Empty",
  modifiedBefore: "Empty",
  open: false,
  partial: true,
  regex: false,
  sizeType: "B",
  type: "file",
};

/**
 * Parses the stdout captured from fsearch stdout and parsers it into reable data format
 * @param {string} stdout
 * @returns {import("./type").fsearchResult[]}
 */
const parseStdout = (stdout: string): fsearchResult[] => {
  /**
   * @type {import("./type").fsearchResult[]}
   */
  const results: fsearchResult[] = [];

  if (!stdout || typeof stdout !== "string") return results;

  const lines = stdout
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  for (const line of lines) {
    // Split only at the FIRST space
    const firstSpaceIndex = line.indexOf(" ");

    if (firstSpaceIndex === -1) {
      // Malformed line, skip
      continue;
    }

    const name = line.substring(0, firstSpaceIndex).trim();
    const path = line.substring(firstSpaceIndex + 1).trim();

    if (!name || !path) continue;

    results.push({ name, path });
  }

  return results;
};

/**
 * Builds args array
 * @param {import("./type").fsearchOptions} options
 * @returns {string[]} Args array
 */
const buildArgs = (options: fsearchOptions) => {
  /** @type {string[]} */
  const args: string[] = [];

  if (options.term) {
    args.push(options.term);
  }

  /**
   * @param {string} flag
   * @param {string | string[] | boolean | undefined | number} value
   */
  const addFlag = (flag: string, value: any) => {
    if (value === undefined || value === null) return;

    // Case 1: boolean flag → only include if true
    if (typeof value === "boolean") {
      if (value) args.push(`--${flag}`);
      return;
    }

    // Case 2: array → comma-separated
    if (Array.isArray(value)) {
      if (value.length > 0) {
        args.push(`--${flag}=${value.join(",")}`);
      }
      return;
    }

    // Case 3: numbers or strings
    args.push(`--${flag}=${value}`);
  };

  addFlag("partial", options.partial);
  addFlag("ignore-case", options.ignoreCase);
  addFlag("open", options.open);
  addFlag("lines", options.lines);
  addFlag("limit", options.limit);
  addFlag("depth", options.depth);
  addFlag("ext", options.ext);
  addFlag("exclude-ext", options.excludeExt);
  addFlag("exclude-dir", options.excludeDir);
  addFlag("min-size", options.minSize);
  addFlag("max-size", options.maxSize);
  addFlag("size-type", options.sizeType);
  addFlag("modified-before", options.modifiedBefore);
  addFlag("modified-after", options.modifiedAfter);
  addFlag("hidden", options.hidden);
  addFlag("count", options.count);
  addFlag("regex", options.regex);
  addFlag("debug", options.debug);
  addFlag("type", options.type);

  if (options.directory) {
    args.push(options.directory);
  }

  return args;
};

/**
 * Search with fsearch binary
 * @param {import("./type").fsearchOptions} options
 * @returns {Promise<import("./type").fsearchResult[]>}
 */
const searchWithFSearch = async (
  options: fsearchOptions,
): Promise<fsearchResult[]> => {
  const bpath = binPath();
  const exePath = await binmanResolve("fsearch", ["fsearch"], bpath);

  if (!exePath) throw new Error("fsearch executable not found");
  if (!fs.existsSync(options.directory))
    throw new Error("Search path does not exist");

  const args = buildArgs(options);

  return new Promise((resolve, reject) => {
    const child = spawn(exePath, args);

    let stdout = "";
    let stderr = "";

    const timeoutId = setTimeout(() => {
      child.kill("SIGKILL");
      reject(
        new Error(
          "fsearch process timed out / could not resolve within the limit of 5 seconds",
        ),
      );
    }, 5000);

    child.stdout.on("data", (data) => (stdout += data.toString()));
    child.stderr.on("data", (data) => (stderr += data.toString()));

    child.on("close", (code) => {
      if (code === 0) {
        try {
          // try to parse the stdout
          const results = parseStdout(stdout);
          clearTimeout(timeoutId);
          resolve(results);
        } catch (err) {
          clearTimeout(timeoutId);
          reject(err);
        }
      } else {
        // other error code failed
        clearTimeout(timeoutId);
        reject(
          new Error(
            `fsearch exited with code ${code}: ${stderr || "No stderr"}`,
          ),
        );
      }
    });
  });
};

const fsearchImpl: CombinedCallback<IpcMainInvokeEventCallback, fsearch> = (
  _,
  options,
) => {
  const newOptions = { ...defaultSearchOptions, ...options };
  return searchWithFSearch(newOptions);
};

/**
 * Contains all fsearch event operations
 */
export interface FSearchEvents {
  fsearch: {
    args: [options: fsearchOptions];
    return: fsearchResult[];
  };
}

/**
 * Register fsearch listeners
 */
export function registerFsearchListeners(typedIpcMain: TypedIpcMain) {
  typedIpcMain.handle("fsearch", fsearchImpl);
}
