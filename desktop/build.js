/**
 * Es Build to compile all js files into a single one for easier building and packing
 */

const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const chalk = require("chalk").default; // For colored console output

// Helper for logging with timestamp
const log = {
  info: (msg) => console.log(`${chalk.blue("[INFO]")} [${new Date().toISOString()}] ${msg}`),
  success: (msg) => console.log(`${chalk.green("[SUCCESS]")} [${new Date().toISOString()}] ${msg}`),
  warn: (msg) => console.warn(`${chalk.yellow("[WARN]")} [${new Date().toISOString()}] ${msg}`),
  error: (msg) => console.error(`${chalk.red("[ERROR]")} [${new Date().toISOString()}] ${msg}`),
};

// Define paths
const distFolder = path.resolve(__dirname, "dist");
const envFile = path.resolve(__dirname, ".env");
const packageFile = path.resolve(__dirname, "package.json");
const distEnvFile = path.join(distFolder, ".env");
const distPackageFile = path.join(distFolder, "package.json");
const preloadScriptPath = path.join(__dirname, "preload.js");
const preloadScriptDestPath = path.join(distFolder, "preload.js");

try {
  log.info("Running TypeScript compiler...");
  execSync("npx tsc", { cwd: __dirname, stdio: "inherit" });
  log.success("TypeScript compilation completed successfully.");
} catch (error) {
  log.error("TypeScript compilation failed. Build stopped.");
  log.error(error.message);
  process.exit(1);
}

// Clean and recreate dist folder
if (fs.existsSync(distFolder)) {
  log.warn(`Deleting existing dist folder at ${distFolder}`);
  fs.rmSync(distFolder, { recursive: true });
}
fs.mkdirSync(distFolder);
log.info(`Created new dist folder at ${distFolder}`);

// Copy .env file
if (!fs.existsSync(envFile)) {
  log.error(".env file not found. Build cannot continue.");
  process.exit(1);
}
fs.copyFileSync(envFile, distEnvFile);
log.info(".env file copied to dist folder.");

// Copy package.json
if (!fs.existsSync(packageFile)) {
  log.error("package.json not found. Build cannot continue.");
  process.exit(1);
}
fs.copyFileSync(packageFile, distPackageFile);
log.info("package.json copied to dist folder.");

// Bundle preload.js using esbuild
if (!fs.existsSync(preloadScriptPath)) {
  log.error("preload.js script not found. Build cannot continue.");
  process.exit(1);
}
log.info("Bundling preload.js with esbuild...");
esbuild
  .build({
    entryPoints: [preloadScriptPath],
    bundle: true,
    platform: "node", // Electron preload runs in a Node-like environment
    target: ["node16"], // adjust Node version as needed
    outfile: preloadScriptDestPath,
    external: ["electron"],
    minify: true,
  })
  .then(() => log.success("preload.js bundled successfully!"))
  .catch((err) => {
    log.error("Failed to bundle preload.js.");
    log.error(err.message);
    process.exit(1);
  });

// Bundle main Electron file using esbuild
log.info("Bundling main index.js with esbuild...");
esbuild
  .build({
    entryPoints: ["index.js"], // your Electron main file
    bundle: true,
    platform: "node",
    target: ["node16"],
    outfile: "dist/index.js",
    external: ["electron"], // don't bundle electron itself
    minify: true,
  })
  .then(() => log.success("Main build completed successfully!"))
  .catch((err) => {
    log.error("Main build failed.");
    log.error(err.message);
    process.exit(1);
  });
