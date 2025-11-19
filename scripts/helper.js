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
 * Ensures a binary packaged inside node_modules has the execute permission.
 * This is necessary because 'npm ci' sometimes removes this flag.
 * @param {string} packageName - The name of the npm package (e.g., 'umbr-dl').
 * @param {string} binaryName - The name of the binary file (e.g., 'go-download-linux').
 */
function ensureExecutable(packageName, binaryName) {
    const binaryPath = path.join(
        __dirname, 
        'node_modules', 
        packageName, 
        'bin', 
        binaryName
    );
    
    // 1. Check if the file exists
    if (fs.existsSync(binaryPath)) {
        let isExecutable = true;
        
        try {
            // 2. Try to access the file with execute permission (X_OK).
            // This function returns void on success and THROWS on failure (EACCES).
            fs.accessSync(binaryPath, fs.constants.X_OK);
        } catch (e) {
            // 3. If it throws, the file is not executable.
            isExecutable = false;
        }

        if (!isExecutable) {
            try {
                logInfo(`Applying chmod +x to: ${binaryName}`);
                // 4. Set rwxr-xr-x permission (0o755)
                fs.chmodSync(binaryPath, 0o755); 
            } catch (error) {
                logError(`Failed to set execute permission on ${binaryName}`, error);
                throw new Error(`Permission fix failed for ${binaryName}`);
            }
        }
    }
}


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
    if (!fs.existsSync(distFolder)) fs.mkdirSync(distFolder, { recursive: true });

    const zipFileName = "download.zip";
    const tempZipPath = path.join(distFolder, zipFileName);

    logInfo(`Downloading zip from ${url}`);
    
    ensureExecutable('umbr-dl', 'go-download-linux'); 
    await download(url, { name: zipFileName, path: distFolder });
    logInfo(`Downloaded zip to ${tempZipPath}`);

    logInfo(`Extracting zip into dist folder: ${distFolder}`);
    
    ensureExecutable('umbr-zip', 'go-unzip-linux'); 
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