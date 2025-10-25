/**
 * Contains all rip grep related code
 */

const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

/**
 * Returns the path to the exe in dev or prod
 */
function getRipGrepPath() {
  let p = path.join(__dirname, "bin", "rg.exe");
  if (!fs.existsSync(p)) {
    return undefined;
  }

  return p;
}

/**
 * Parses ripgrep stdout and converts it to structured objects with match indices
 * @param {string} stdout - Full stdout returned by ripgrep
 * @param {string} searchTerm - The term that was searched
 * @returns {ripGrepResult[]} Array of structured results
 */
function parseRipgrepOutput(stdout, searchTerm) {
  const resultsMap = new Map();
  const lines = stdout.split(/\r?\n/).filter(Boolean);

  lines.forEach((line) => {
    // ripgrep default format: filePath:lineNumber:content
    const match = line.match(/^(.+?):\d+:(.*)$/);
    if (!match) return;

    const [_, filePath, content] = match;
    const startIndex = content.indexOf(searchTerm);
    if (startIndex === -1) return; // skip if searchTerm not found

    const endIndex = startIndex + searchTerm.length;

    if (!resultsMap.has(filePath)) {
      const fileName = path.basename(filePath);
      const directoryName = path.dirname(filePath);
      resultsMap.set(filePath, {
        filePath,
        fileName,
        directoryName,
        lines: [],
      });
    }

    resultsMap.get(filePath).lines.push({
      content,
      startIndex,
      endIndex,
    });
  });

  return Array.from(resultsMap.values());
}
/**
 * Builds an array of arguments to pass to ripgrep based on options
 * @param {ripgrepArgsOptions} options
 * @returns {string[]} Array of arguments for ripgrep
 */
function buildRipgrepArgs(options) {
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
 * @param {ripgrepArgsOptions} options
 * @returns {Promise<ripGrepResult[]>}
 */
function searchWithRipGrep(options) {
  return new Promise((resolve, reject) => {
    const ripGrepPath = getRipGrepPath();

    if (!ripGrepPath) return reject(new Error("Ripgrep path is undefined"));
    if (!fs.existsSync(options.searchPath))
      return reject(new Error("Search path does not exist"));

    let args = buildRipgrepArgs(options);

    const ripGrep = spawn(ripGrepPath, args);

    let stdout = "";
    let stderr = "";
    let settled = false;

    function safeResolve(/** @type {ripGrepResult[]}*/ val) {
      if (!settled) {
        settled = true;
        clearTimeout(timeOutId);
        resolve(val);
      }
    }

    function safeReject(/** @type {Error}*/ err) {
      if (!settled) {
        settled = true;
        clearTimeout(timeOutId);
        reject(err);
      }
    }

    const timeOutId = setTimeout(() => {
      ripGrep.kill();
      safeReject(new Error("Ripgrep timeout exceeded"));
    }, 30000);

    ripGrep.stdout.on("data", (data) => (stdout += data.toString()));
    ripGrep.stderr.on("data", (data) => (stderr += data.toString()));

    ripGrep.on("error", () => safeReject(new Error("Failed to spawn ripgrep")));

    ripGrep.on("close", (code) => {
      if (code === 0) {
        let data = parseRipgrepOutput(stdout, options.searchTerm);
        safeResolve(data);
      } else {
        safeReject(new Error(`Ripgrep exited with code ${code}: ${stderr}`));
      }
    });
  });
}

/** @type {ripGrep} */
const ripGrepImpl = async (_event = undefined, options) => {
  return await searchWithRipGrep(options);
};

module.exports = {
  ripGrepImpl,
};
