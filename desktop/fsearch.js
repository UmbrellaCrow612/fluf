/**
 * Contains all the code to interact with fsearch
 */

const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { isPackaged } = require("./packing");

/** @type {fsearchOptions} */
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
 * @returns {fsearchResult[]}
 */
const parseStdout = (stdout) => {
  /**
   * @type {fsearchResult[]}
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
 * Get the exe path of fsearch binary based on the platform where running on
 * @returns {string | undefined}
 */
const getExePath = () => {
  const isPackagedManual = isPackaged();

  let p;

  if (isPackagedManual) {
    // Packaged: use process.resourcesPath
    p = path.join(
      process.resourcesPath,
      "bin",
      "fsearch",
      "windows",
      "fsearch.exe"
    );

    // TODO: add other platforms
  } else {
    // Development: use __dirname
    p = path.join(__dirname, "bin", "fsearch", "windows", "fsearch.exe");
  }

  if (!fs.existsSync(p)) {
    console.error("Ripgrep path not found:", p);
    return undefined;
  }

  return p;
};

/**
 * Builds args array
 * @param {fsearchOptions} options
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
 * @param {fsearchOptions} options
 * @returns {Promise<fsearchResult[]>}
 */
const searchWithFSearch = (options) => {
  return new Promise((resolve, reject) => {
    try {
      const exePath = getExePath();
      if (!exePath) {
        return reject(new Error(`Executable not found: ${exePath}`));
      }

      const args = buildArgs(options);
      const child = spawn(exePath, args);

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      const timeout = setTimeout(() => {
        child.kill("SIGKILL");
        reject(new Error("Search timed out after 5 seconds"));
      }, 5000);

      child.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      child.on("close", (code) => {
        clearTimeout(timeout);

        if (code !== 0) {
          return reject(
            new Error(
              `fsearch exited with code ${code}. Error: ${
                stderr || "No stderr"
              }`
            )
          );
        }

        resolve(parseStdout(stdout));
      });
    } catch (error) {
      reject(error);
    }
  });
};

/** @type {fsearch} */
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
