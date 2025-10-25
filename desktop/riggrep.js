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
 * Parse ripgrep JSON output into structured results
 * @param {string} jsonOutput - The JSON output from ripgrep
 * @returns {ripGrepResult[]}
 */
function parseRipGrepOutput(jsonOutput) {
  const lines = jsonOutput
    .trim()
    .split("\n")
    .filter((line) => line);
  const fileMap = new Map();

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);

      // Only process match entries
      if (entry.type === "match") {
        const filePath = entry.data.path.text;
        const fileName = path.basename(filePath);
        const directoryName = path.basename(path.dirname(filePath));

        if (!fileMap.has(filePath)) {
          fileMap.set(filePath, {
            filePath,
            fileName,
            directoryName,
            lines: [],
          });
        }

        const fileResult = fileMap.get(filePath);
        const lineText = entry.data.lines.text;

        // Extract match positions from submatches
        if (entry.data.submatches && entry.data.submatches.length > 0) {
          for (const submatch of entry.data.submatches) {
            fileResult.lines.push({
              content: lineText,
              startIndex: submatch.start,
              endIndex: submatch.end,
            });
          }
        }
      }
    } catch (err) {
      // Skip malformed JSON lines
      console.error("Failed to parse ripgrep output line:", err);
    }
  }

  return Array.from(fileMap.values());
}

/**
 * Execute ripgrep search with given parameters
 * @param {string} regex - The regex pattern to look for
 * @param {string} searchPath - The path to the file or folder to search in
 * @param {ripgGrepOptions} options - Search refinement options
 * @param {string} args - Any additional args to pass to ripgrep like --case or something from it like `--case-sensitive,--hidden`
 * @param {number} timeout - The timeout in milliseconds to stop if it exceeds it
 * @returns {Promise<ripGrepResult[]>}
 */
function searchWithRipGrep(
  regex,
  searchPath,
  options = { exclude: "", include: "" },
  args = "",
  timeout = 30000
) {
  return new Promise((resolve, reject) => {
    const rgPath = getRipGrepPath();

    if (!rgPath) {
      return reject(new Error("ripgrep executable not found"));
    }

    if (!fs.existsSync(searchPath)) {
      return reject(new Error(`Search path does not exist: ${searchPath}`));
    }

    // Build ripgrep arguments
    const rgArgs = [
      "--json", // Output as JSON for easier parsing
      "--no-heading", // Don't group matches by file
      "--line-number", // Include line numbers
    ];

    // Add include patterns
    if (options.include) {
      const includes = options.include.split(",").map((p) => p.trim());
      includes.forEach((pattern) => {
        if (pattern) {
          rgArgs.push("--glob", pattern);
        }
      });
    }

    // Add exclude patterns
    if (options.exclude) {
      const excludes = options.exclude.split(",").map((p) => p.trim());
      excludes.forEach((pattern) => {
        if (pattern) {
          rgArgs.push("--glob", `!${pattern}`);
        }
      });
    }

    // Parse and add additional args
    if (args) {
      const additionalArgs = args.split(",").map((arg) => arg.trim());
      additionalArgs.forEach((arg) => {
        if (arg.startsWith("--")) {
          const [flag, value] = arg.split("=");
          if (value) {
            rgArgs.push(flag, value);
          } else {
            rgArgs.push(flag);
          }
        }
      });
    }

    // Add the search pattern and path
    rgArgs.push(regex, searchPath);

    // Spawn ripgrep process
    const rg = spawn(rgPath, rgArgs);

    let stdout = "";
    let stderr = "";
    let isTimedOut = false;

    // Set timeout
    const timeoutId = setTimeout(() => {
      isTimedOut = true;
      rg.kill();
      reject(new Error(`Search timed out after ${timeout}ms`));
    }, timeout);

    rg.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    rg.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    rg.on("close", (code) => {
      console.log("Rip grep killed")
      clearTimeout(timeoutId);

      if (isTimedOut) {
        return; // Already rejected
      }

      // ripgrep returns:
      // 0 - matches found
      // 1 - no matches found (not an error)
      // 2+ - error occurred
      if (code === 0 || code === 1) {
        try {
          const results = code === 0 ? parseRipGrepOutput(stdout) : [];
          resolve(results);
        } catch (err) {
          reject(new Error(`Failed to parse ripgrep output: ${err.message}`));
        }
      } else {
        reject(new Error(`ripgrep exited with code ${code}: ${stderr}`));
      }
    });

    rg.on("error", (err) => {
      clearTimeout(timeoutId);
      reject(new Error(`Failed to spawn ripgrep: ${err.message}`));
    });
  });
}

/**
 * @type {ripGrep}
 */
const ripGrepImpl = async (
  _event = undefined,
  searchDirectory,
  term,
  options
) => {
  const results = await searchWithRipGrep(
    term,
    searchDirectory,
    options,
    "--case-sensitive,--hidden",
    30000
  );

  return results;
};

module.exports = {
  ripGrepImpl
};
