/**
 * Contains code to use the folder search binary
 */

const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

/**
 * Gets the path to the fos exe binary
 */
function getExePath() {
  let p = path.join(__dirname, "bin", "fos.exe");
  if (!fs.existsSync(p)) {
    return undefined;
  }

  // todo add diff pa based on if it's bundled

  return p;
}

/**
 * Build a string array of args to be passed to fos
 * @param {fosOptions} options Options
 * @param {string} term The search term
 * @param {string} path Path to search in
 * @returns {string[]} Args array
 */
function buildFosArgs(term, path, options) {
  /** @type {string[]} */
  let args = [];

  // first arg is always the search term
  args.push(term);

  // add all options in middle
  if (options.partial) args.push("--p");
  if (options.caseInsensitive) args.push("--c");
  if (options.exclude) args.push(`--e=${options.exclude.join(",")}`);
  if (options.depth && options.depth > 0) args.push(`--d=${options.depth}`);
  if (options.includeHidden) args.push("--include-hidden");
  if (options.open) args.push("--open");
  if (options.preview) args.push("--preview");
  if (options.countOnly) args.push("--count-only");
  if (options.limit && options.limit > 0) args.push(`--limit=${options.limit}`);
  if (options.sort) args.push(`--sort=${options.sort}`);
  if (options.debug) args.push("--debug");

  // final arg is awlays the search path
  args.push(path);

  console.log(args);

  return args;
}

/**
 * Parses stdout from fos into structured results
 * @param {string} stdoutData The raw stdout string from fos
 * @returns {fosResult[]} Parsed folder search results
 */
function parseFosOutput(stdoutData) {
  if (!stdoutData || !stdoutData.trim()) return [];

  const lines = stdoutData
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  /** @type {fosResult[]} */
  const results = [];

  for (const line of lines) {
    const parts = line.split(/\s+/); // split by any whitespace
    if (parts.length < 2) continue;

    const name = parts[0];
    const folderPath = parts.slice(1).join(" "); // in case path has spaces
    results.push({ name, path: folderPath });
  }

  return results;
}

/**
 * Internal impl
 * @param {string} term
 * @param {string} searchPath
 * @param {fosOptions} options
 * @returns {Promise<fosResult[]>}
 */
const searchWithFos = (term, searchPath, options) => {
  return new Promise((resolve, reject) => {
    const exePath = getExePath();
    if (!exePath) {
      return reject(new Error("fos executable not found."));
    }

    const args = buildFosArgs(term, searchPath, options);
    const proc = spawn(exePath, args);

    let stdoutData = "";
    let stderrData = "";
    let finished = false;

    // 5-second timeout
    const timeout = setTimeout(() => {
      if (!finished) {
        finished = true;
        proc.kill("SIGTERM");
        reject(new Error("fos search timed out after 5 seconds."));
      }
    }, 5000);

    proc.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderrData += data.toString();
    });

    proc.on("close", (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);

      if (code !== 0 && stderrData) {
        return reject(new Error(stderrData.trim()));
      }

      const results = parseFosOutput(stdoutData);
      resolve(results);
    });
  });
};

/**
 * Impl for folder search using fos.exe binary
 * @type {fos}
 */
const fosSearchImpl = async (_event = undefined, term, path, options) => {
  return searchWithFos(term, path, options);
};

module.exports = {
  fosSearchImpl,
};
