/**
 * Script builds the final dist folder for the Electron desktop app
 * Binaries (bin) are copied outside the ASAR to allow execution.
 */

const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { exit } = require("process");
const { createPackage } = require("@electron/asar");

const { logError, logInfo, downloadAndExtractZipToDist } = require("./helper");
const { parse } = require("./args");

async function main() {
  logInfo("Starting build");

  /** The URL to download the specific electron binarys */
  let downloadUrl;

  const options = parse();

  if (options.platform == "windows") {
    downloadUrl =
      "https://github.com/electron/electron/releases/download/v39.2.2/electron-v39.2.2-win32-x64.zip";
  }

  if (options.platform == "darwin") {
    downloadUrl =
      "https://github.com/electron/electron/releases/download/v39.2.2/electron-v39.2.2-darwin-x64.zip";
  }

  if (options.platform == "linux") {
    downloadUrl =
      "https://github.com/electron/electron/releases/download/v39.2.2/electron-v39.2.2-linux-x64.zip";
  }

  if (!downloadUrl) {
    logError("Download URL not set " + downloadUrl);
    process.exit(1);
  }

  const distPath = path.join(__dirname, "..", "dist");
  const uiPath = path.join(__dirname, "..", "ui");
  const uiDistPath = path.join(uiPath, "dist", "ui", "browser");
  const desktopPath = path.join(__dirname, "..", "desktop");
  const desktopDistPath = path.join(desktopPath, "dist");
  const desktopBinPath = path.join(desktopPath, "bin");

  const distAppPath = path.join(distPath, "resources", "app");
  const asarFilePath = path.join(distPath, "resources", "app.asar");

  const extraResourcesPath = path.join(distPath, "resources", "bin");

  // Clean previous dist
  if (fs.existsSync(distPath)) {
    logInfo("Removing previous dist build");
    fs.rmSync(distPath, { recursive: true });
  }

  // Validate paths
  [uiPath, desktopPath].forEach((p) => {
    if (!fs.existsSync(p)) {
      logError(`${p} not found`);
      exit(1);
    } else {
      logInfo(`${p} found`);
    }
  });

  // Create dist and app folders
  [distPath, distAppPath].forEach((p) => {
    if (!fs.existsSync(p)) {
      logInfo("Creating folder: " + p);
      fs.mkdirSync(p, { recursive: true });
    }
  });

  // Build Desktop
  logInfo("Building Desktop source code");
  try {
    logInfo("Running npm run build at " + desktopPath);
    execSync(`npm run build:${options.platform}`, {
      cwd: desktopPath,
      stdio: "inherit",
    });
  } catch {
    logError("Desktop build failed");
    exit(1);
  }

  if (!fs.existsSync(desktopDistPath) || !fs.existsSync(desktopBinPath)) {
    logError("Desktop dist or bin not found");
    exit(1);
  }

  logInfo("Desktop build completed successfully");

  // Build UI
  logInfo("Building UI source code");
  try {
    execSync("npm ci", { cwd: uiPath, stdio: "inherit" });
    execSync("npm run build", { cwd: uiPath, stdio: "inherit" });
    logInfo("UI build completed successfully");
  } catch {
    logError("UI build failed");
    exit(1);
  }

  if (!fs.existsSync(uiDistPath)) {
    logError("UI dist path not found");
    exit(1);
  }

  // Copy Desktop & UI into app folder for ASAR
  logInfo("Copying Desktop dist into " + distAppPath);
  fs.cpSync(desktopDistPath, distAppPath, { recursive: true });

  logInfo("Copying UI dist into " + distAppPath);
  fs.cpSync(uiDistPath, distAppPath, { recursive: true });

  // Copy Desktop binaries outside ASAR
  fs.mkdirSync(extraResourcesPath, { recursive: true });
  logInfo("Copying Desktop bin into " + extraResourcesPath);
  fs.cpSync(desktopBinPath, extraResourcesPath, { recursive: true });

  // Pack app folder into ASAR (without binaries)
  logInfo("Packing desktop files into ASAR format");
  await createPackage(distAppPath, asarFilePath);

  // Remove uncompressed app folder
  logInfo("Removing uncompressed app folder");
  fs.rmSync(distAppPath, { recursive: true });

  // Download Electron binaries directly into dist folder
  logInfo("Downloading Electron binaries from " + downloadUrl);
  await downloadAndExtractZipToDist(downloadUrl, distPath);

  logInfo("Build completed successfully!");
}

// Run main
main().catch((err) => {
  logError("Build script failed: " + err);
  exit(1);
});
