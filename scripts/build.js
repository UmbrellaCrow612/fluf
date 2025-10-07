/**
 * Script builds the final dist folder for the electron desktop app
 */

const path = require("path");
const fs = require("fs");
const {
  logError,
  logInfo,
  getArgsMap,
  platforms,
  isSuportedPlatform,
  printPlatforms,
  donwloadAndExtractZip,
} = require("./helper");
const { execSync } = require("child_process");
const { exit } = require("process");
const { createPackage } = require("@electron/asar");

logInfo("Starting build");
let argsMap = getArgsMap();

const distPath = path.join(__dirname, "..", "dist");
const uiPath = path.join(__dirname, "..", "ui");
const uiDistPath = path.join(uiPath, "dist");
const desktopPath = path.join(__dirname, "..", "desktop");
const desktopDistPath = path.join(desktopPath, "dist");

// change based on platform - these are for windows
const distAppPath = path.join(distPath, "resources", "app");
const asarFilePath = path.join(distPath, "resources", "app.asar");

const electronZipDownloadPath = path.join(distPath, "electron_binarys.zip");

const basePackageUrl = "https://github.com/electron/electron/releases/download";
let downloadUrl = basePackageUrl;

if (fs.existsSync(distPath)) {
  logInfo("Removing previous dist build");
  fs.rmSync(distPath, { recursive: true });
}

let platform = argsMap.get("platform");
if (!platform || !isSuportedPlatform(platform)) {
  logError("--platform not passed");
  printPlatforms();
  exit(1);
}

let argElectronVersion = argsMap.get("electronVersion");
if (!argElectronVersion || typeof argElectronVersion !== "string") {
  logError(
    "--electronVersion not passed or valid string value " + argElectronVersion
  );
  exit(1);
} else {
  logInfo("Building with electron version " + argElectronVersion);
  downloadUrl += `/${argElectronVersion}`;
}

let platformPackageVersion = argsMap.get("platformPackage");
if (!platformPackageVersion || typeof platformPackageVersion !== "string") {
  logError(
    "--platformPackage not passed or valid string value " +
      platformPackageVersion
  );
  exit(1);
} else {
  logInfo("Building with platform package " + platformPackageVersion);
  downloadUrl += `/${platformPackageVersion}`;
}

if (!fs.existsSync(uiPath)) {
  logError("UI path not found");
  exit(1);
} else {
  logInfo("UI path found at " + uiPath);
}

if (!fs.existsSync(desktopPath)) {
  logError("Desktop path not found");
  exit(1);
} else {
  logInfo("Desktop path found at " + desktopPath);
}

logInfo("Building UI source code");

try {
  logInfo("Running npm ci");
  execSync("npm ci", { cwd: uiPath, stdio: "inherit" });

  logInfo("Running npm run build");
  execSync("npm run build", { cwd: uiPath, stdio: "inherit" });

  logInfo("UI build completed successfully");
} catch (err) {
  logError("UI build failed");
  exit(1);
}

if (!fs.existsSync(uiDistPath)) {
  logError("UI dist path not found at " + uiDistPath);
  exit(1);
} else {
  logInfo("UI dist path found at " + uiDistPath);
}

if (!fs.existsSync(distPath)) {
  logInfo("Creating dist folder at " + distPath);
  fs.mkdirSync(distPath, { recursive: true });
}

if (!fs.existsSync(distAppPath)) {
  logInfo("Creating app folder at " + distAppPath);
  fs.mkdirSync(distAppPath, { recursive: true });
}

logInfo("Building Desktop source code");
try {
  logInfo("Running node build.js");
  execSync("node build.js", { cwd: desktopPath, stdio: "inherit" });
} catch (err) {
  logError("Desktop build failed");
  exit(1);
}

if (!fs.existsSync(desktopDistPath)) {
  logError("Desktop build dist not found at " + desktopDistPath);
  exit(1);
} else {
  logInfo("Desktop build dist found at " + desktopDistPath);
}

logInfo("Copying desktop dist into " + distAppPath);
fs.cpSync(desktopDistPath, distAppPath, { recursive: true });

logInfo("Copying UI source dist files into " + distAppPath);
fs.cpSync(uiDistPath, distAppPath, { recursive: true });

(async () => {
  logInfo("Packing desktop files into asar format");
  await createPackage(distAppPath, asarFilePath);

  logInfo("Removing " + distAppPath);
  fs.rmSync(distAppPath, { recursive: true });

  logInfo("Downloading electron zip folder to " + electronZipDownloadPath);
  await donwloadAndExtractZip(downloadUrl, electronZipDownloadPath, distPath);

  logInfo("Build completed successfully!");
})();
