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
} = require("./helper");
const { execSync } = require("child_process");
const { exit } = require("process");

logInfo("Starting build");
let argsMap = getArgsMap();

const distPath = path.join(__dirname, "..", "dist");
const uiPath = path.join(__dirname, "..", "ui");
const uiDistPath = path.join(uiPath, "dist");
const desktopPath = path.join(__dirname, "..", "desktop");

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

logInfo("Building Desktop source code"); // todo

if (platform === platforms.windows) {
  logInfo("Building for windows");
  // download specific binarys and set app location
}

if (platform === platforms.linux) {
  logInfo("Building for linux");
  // download specific binarys and set app location
}

if (platform === platforms.macOs) {
  logInfo("Building for macOs");
  // download specific binarys and set app location
}