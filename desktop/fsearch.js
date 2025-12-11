/**
 * Contains all the code to interact with fsearch
 */

const fs = require("fs");
const { spawn } = require("child_process");
const { binPath } = require("./packing");
const { binmanResolve } = require("umbr-binman");

/** @type {import("./type").fsearchOptions} */
const defaultSearchOptions = {
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
const parseStdout = (stdout) => {
  /**
   * @type {import("./type").fsearchResult[]}
   */
  const results = [];

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
const buildArgs = (options) => {
  /** @type {string[]} */
  const args = [];

  if (options.term) {
    args.push(options.term);
  }

  /**
   * @param {string} flag
   * @param {string | string[] | boolean | undefined | number} value
   */
  const addFlag = (flag, value) => {
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
const searchWithFSearch = async (options) => {
  const exePath = await binmanResolve("fsearch", ["fsearch"], binPath());

  if (!exePath) throw new Error("fsearch executable not found");
  if (!fs.existsSync(options.directory))
    throw new Error("Search path does not exist");

  const args = buildArgs(options);

  return new Promise((resolve, reject) => {
    const child = spawn(exePath, args);

    let stdout = "";
    let stderr = "";
    let settled = false;

    function safeResolve(/** @type {any}*/ val) {
      if (!settled) {
        settled = true;
        clearTimeout(timeoutId);
        resolve(val);
      }
    }

    function safeReject(/** @type {any}*/ err) {
      if (!settled) {
        settled = true;
        clearTimeout(timeoutId);
        reject(err);
      }
    }

    const timeoutId = setTimeout(() => {
      child.kill("SIGKILL");
      safeReject(new Error("fsearch timeout exceeded (5s)"));
    }, 5000);

    child.stdout.on("data", (data) => (stdout += data.toString()));
    child.stderr.on("data", (data) => (stderr += data.toString()));

    child.on("error", (err) =>
      safeReject(new Error(`Failed to spawn fsearch: ${err.message}`))
    );

    child.on("close", (code) => {
      if (code === 0) {
        try {
          const results = parseStdout(stdout);
          safeResolve(results);
        } catch (err) {
          safeReject(err);
        }
      } else {
        safeReject(
          new Error(
            `fsearch exited with code ${code}: ${stderr || "No stderr"}`
          )
        );
      }
    });
  });
};

/** @type {import("./type").fsearch} */
const fsearchImpl = async (_, options) => {
  let newOptions = { ...defaultSearchOptions, ...options };
  return await searchWithFSearch(newOptions);
};

/**
 * Register fsearch listeners
 * @param {import("electron").IpcMain} ipcMain
 */
function registerFsearchListeners(ipcMain) {
  ipcMain.handle("fsearch", fsearchImpl);
}

module.exports = { registerFsearchListeners };
