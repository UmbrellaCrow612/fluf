/**
 * Contains all util helper functions for build
 */

const chalk = require("chalk").default;
const fs = require("fs");
const { exit } = require("process");
const path = require("path");
const { unzip } = require("umbr-zip");
const { download } = require("umbr-dl");

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
 * Download and extract a ZIP file from a URL directly into the `dist` folder.
 * @param {string} url - The URL to fetch the ZIP file from.
 * @param {string} distFolder - The folder where the contents will be extracted (e.g., C:/dev/fluf/dist).
 */
async function downloadAndExtractZipToDist(url, distFolder) {
  try {
    if (!fs.existsSync(distFolder))
      fs.mkdirSync(distFolder, { recursive: true });

    const zipFileName = "download.zip";
    const tempZipPath = path.join(distFolder, zipFileName);

    logInfo(`Downloading zip from ${url}`);

    await download(url, { name: zipFileName, path: distFolder });
    logInfo(`Downloaded zip to ${tempZipPath}`);

    logInfo(`Extracting zip into dist folder: ${distFolder}`);

    await unzip(tempZipPath, distFolder, { timeout: 60000 });

    // Clean up temporary zip
    fs.unlinkSync(tempZipPath);
    logInfo("Temporary zip removed successfully");
  } catch (error) {
    logError("Error occurred downloading or extracting zip", error);
    exit(1);
  }
}

module.exports = {
  logError,
  logInfo,
  downloadAndExtractZipToDist,
};
