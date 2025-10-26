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
 * Parses ripgrep --vimgrep stdout and converts it to structured objects
 * @param {string} stdout - Full stdout returned by ripgrep (with --vimgrep)
 * @param {string} searchTerm - The search term
 * @returns {ripGrepResult[]} Array of structured results
 */
function parseRipgrepOutput(stdout, searchTerm) {
  /**
   * Contains the file path i.e file and the ripgrep result for it
   * @type {Map<string, ripGrepResult>}
   */
  const map = new Map();

  const lines = stdout.split(/\r?\n/);
  const lineRegex = /^(.+?):(\d+):(\d+):(.*)$/; // file:line:column:text

  for (const line of lines) {
    if (!line.trim()) continue;

    const match = lineRegex.exec(line);
    if (!match) continue;

    const [, filePath, lineNumberStr, , content] = match;
    const lineNumber = parseInt(lineNumberStr, 10);

    // Initialize entry for this file
    if (!map.has(filePath)) {
      const parts = filePath.split(/[/\\]/);
      const fileName = parts.pop();
      const directoryName = parts.pop() || "";
      map.set(filePath, {
        filePath,
        fileName,
        directoryName,
        lines: [],
      });
    }

    // Extract before, match, after for the found term
    const regex = new RegExp(searchTerm, "i");
    const found = regex.exec(content);
    if (!found) continue;

    const before = content.slice(0, found.index);
    const matchText = found[0];
    const after = content.slice(found.index + matchText.length);

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
      if (code === 0 || code === 1) {
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
