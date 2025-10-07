/**
 * Contains all util helper functions for build
 */

const chalk = require("chalk").default;
const fs = require("fs");
const { exit } = require("process");
const { finished } = require("stream/promises");
const { Readable } = require("stream");
const unzipper = require("unzipper");
const path = require("path");

/**
 * Logs an error message to the console with timestamp and optional details.
 * @param {string} message - The main error message.
 * @param {object} [details] - Optional additional details (like stack, object info, etc.)
 */
function logError(message, details) {
  const timestamp = new Date().toISOString();
  console.error(chalk.red(`[ERROR] [${timestamp}] ${message}`));

  if (details) {
    if (details instanceof Error) {
      console.error(chalk.red(details.stack));
    } else {
      console.error(chalk.red(JSON.stringify(details, null, 2)));
    }
  }
}

/**
 * Logs an informational message to the console with timestamp and optional details.
 * @param {string} message - The main info message.
 * @param {object} [details] - Optional additional details
 */
function logInfo(message, details) {
  const timestamp = new Date().toISOString();
  console.log(chalk.blue(`[INFO] [${timestamp}] ${message}`));

  if (details) {
    if (details instanceof Error) {
      console.log(chalk.blue(details.stack));
    } else {
      console.log(chalk.blue(JSON.stringify(details, null, 2)));
    }
  }
}

/**
 * Get all args passed to the script in the form of a map
 * @returns {Map} Map of key value pairs of args passed to the script
 */
function getArgsMap() {
  const args = process.argv.slice(2); // skip node and script path
  const argsMap = new Map();

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith("--")) {
      // Handle --key=value
      if (arg.includes("=")) {
        const [key, value] = arg.slice(2).split("=");
        argsMap.set(key, value);
      } else {
        // Handle --key value
        const key = arg.slice(2);
        const value =
          args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : true;
        argsMap.set(key, value);
      }
    } else {
      // standalone value, use index as key
      argsMap.set(`arg${i}`, arg);
    }
  }

  return argsMap;
}

/**
 * List of platforms
 */
const platforms = {
  windows: "windows",
  linux: "linux",
  macOs: "macOs",
};

/**
 * Helper to check if a str is a supported platform
 * @param {string} str Platform passed
 * @returns {boolean} If the string is part of the supported platforms
 */
function isSuportedPlatform(str) {
  return new Set(Object.keys(platforms)).has(str);
}

/**
 * Helper to print all str platforms
 */
function printPlatforms() {
  Object.keys(platforms).forEach((p) => {
    logInfo("Platform supported " + p);
  });
}

/**
 * Download and extract a ZIP file from a URL.
 * @param {string} url - The URL to fetch the ZIP file from.
 * @param {string} downloadPath - The full path to save the ZIP file (e.g., C:/dev/fluf/dist/electron.zip).
 * @param {string} extractPath - The directory where the ZIP file will be extracted.
 */
async function donwloadAndExtractZip(url, downloadPath, extractPath) {
  try {
    // Ensure parent folders exist
    const parentDir = path.dirname(downloadPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    if (!fs.existsSync(extractPath)) {
      fs.mkdirSync(extractPath, { recursive: true });
    }

    logInfo(`Downloading zip from ${url}`);
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Failed to download: ${res.status} ${res.statusText}`);
    }

    // Stream the file to disk
    const fileStream = fs.createWriteStream(downloadPath);
    // @ts-ignore
    await finished(Readable.fromWeb(res.body).pipe(fileStream));

    logInfo(`Extracting zip to ${extractPath}...`);
    await fs
      .createReadStream(downloadPath)
      .pipe(unzipper.Extract({ path: extractPath }))
      .promise();

    logInfo("Extraction complete. Cleaning up...");
    fs.unlinkSync(downloadPath);

    logInfo("Download zip removed successfully");
  } catch (error) {
    logError("Error occurred fetching or extracting zip folder", error);
    exit(1);
  }
}

module.exports = {
  logError,
  logInfo,
  getArgsMap,
  platforms,
  isSuportedPlatform,
  printPlatforms,
  donwloadAndExtractZip,
};
