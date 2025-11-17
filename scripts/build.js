/**
 * Script builds the final dist folder for the Electron desktop app
 * Binaries (bin) are copied outside the ASAR to allow execution.
 */

const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { exit } = require("process");
const { createPackage } = require("@electron/asar");

const {
  logError,
  logInfo,
  getArgsMap,
  isSuportedPlatform,
  printPlatforms,
  donwloadAndExtractZip,
} = require("./helper");

async function main() {
  logInfo("Starting build");
  const argsMap = getArgsMap();

  const distPath = path.join(__dirname, "..", "dist");
  const uiPath = path.join(__dirname, "..", "ui");
  const uiDistPath = path.join(uiPath, "dist", "ui", "browser");
  const desktopPath = path.join(__dirname, "..", "desktop");
  const desktopDistPath = path.join(desktopPath, "dist");
  const desktopBinPath = path.join(desktopPath, "bin");

  const distAppPath = path.join(distPath, "resources", "app");
  const asarFilePath = path.join(distPath, "resources", "app.asar");

  const extraResourcesPath = path.join(distPath, "resources", "bin");
  const electronZipDownloadPath = path.join(distPath, "electron_binarys.zip");

  const basePackageUrl = "https://github.com/electron/electron/releases/download";

  // Clean previous dist
  if (fs.existsSync(distPath)) {
    logInfo("Removing previous dist build");
    fs.rmSync(distPath, { recursive: true });
  }

  // Validate platform
  const platform = argsMap.get("platform");
  if (!platform || !isSuportedPlatform(platform)) {
    logError("--platform not passed or unsupported");
    printPlatforms();
    exit(1);
  }

  // Validate Electron version
  const electronVersion = argsMap.get("electronVersion");
  if (!electronVersion || typeof electronVersion !== "string") {
    logError("--electronVersion not passed or invalid");
    exit(1);
  }

  logInfo("Building with Electron version " + electronVersion);

  // Validate platform package version
  const platformPackageVersion = argsMap.get("platformPackage");
  if (!platformPackageVersion || typeof platformPackageVersion !== "string") {
    logError("--platformPackage not passed or invalid");
    exit(1);
  }

  logInfo("Building with platform package " + platformPackageVersion);

  const downloadUrl = `${basePackageUrl}/${electronVersion}/${platformPackageVersion}`;

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
    execSync("npm run build", { cwd: desktopPath, stdio: "inherit" });
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

  // Download Electron binaries
  logInfo("Downloading Electron binaries from " + downloadUrl);
  await donwloadAndExtractZip(downloadUrl, electronZipDownloadPath, distPath);

  logInfo("Build completed successfully!");
}

// Run main
main().catch((err) => {
  logError("Build script failed: " + err);
  exit(1);
});
