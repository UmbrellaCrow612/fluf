/**
 * ESBuild script to compile all JS files into the dist folder for packaging.
 */

const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const chalk = require("chalk").default;

// Logging helper
const log = {
  info: (msg) =>
    console.log(`${chalk.blue("[INFO]")} [${new Date().toISOString()}] ${msg}`),
  success: (msg) =>
    console.log(
      `${chalk.green("[SUCCESS]")} [${new Date().toISOString()}] ${msg}`
    ),
  warn: (msg) =>
    console.warn(
      `${chalk.yellow("[WARN]")} [${new Date().toISOString()}] ${msg}`
    ),
  error: (msg) =>
    console.error(
      `${chalk.red("[ERROR]")} [${new Date().toISOString()}] ${msg}`
    ),
};

// Paths
const distFolder = path.resolve(__dirname, "dist");
const envFile = path.resolve(__dirname, ".env");
const packageFile = path.resolve(__dirname, "package.json");
const distEnvFile = path.join(distFolder, ".env");
const distPackageFile = path.join(distFolder, "package.json");
const binPath = path.join(__dirname, "bin");

const entryPoints = {
  index: path.resolve(__dirname, "index.js"),
  preload: path.resolve(__dirname, "preload.js"),
};

log.info("Switching to Node 20...");
try {
  execSync("nvm use 20", { stdio: "inherit" });
  log.success("Switched to Node 20");
} catch (error) {
  log.error("Failed to run nvm use 20: " + error.message);
  process.exit(1);
}

// install deps specific install script
try {
  log.info("Downloading deps...");
  execSync("node scripts/install.js", { stdio: "inherit" });
} catch (error) {
  log.error("Failed to install deps. " + error);
  process.exit(1);
}

// Clean and recreate dist folder
if (fs.existsSync(distFolder)) {
  log.warn(`Deleting existing dist folder at ${distFolder}`);
  fs.rmSync(distFolder, { recursive: true });
}

// Run ESLint first
try {
  log.info("Running ESLint...");
  execSync("npx eslint . --ext .js", { stdio: "inherit" });
  log.success("ESLint completed successfully. No linting errors found.");
} catch (error) {
  log.error("ESLint found errors. Build stopped. " + error);
  process.exit(1);
}

// Run TypeScript compilation
try {
  log.info("Running TypeScript compiler...");
  execSync("npx tsc", { cwd: __dirname, stdio: "inherit" });
  log.success("TypeScript compilation completed successfully.");
} catch (error) {
  log.error("TypeScript compilation failed. Build stopped.");
  log.error(error.message);
  process.exit(1);
}

fs.mkdirSync(distFolder);
log.info(`Created new dist folder at ${distFolder}`);

// Copy .env and package.json
if (!fs.existsSync(envFile)) {
  log.error(".env file not found. Build cannot continue.");
  process.exit(1);
}
fs.copyFileSync(envFile, distEnvFile);
log.info(".env file copied to dist folder.");

if (!fs.existsSync(packageFile)) {
  log.error("package.json not found. Build cannot continue.");
  process.exit(1);
}
fs.copyFileSync(packageFile, distPackageFile);
log.info("package.json copied to dist folder.");

// Validate entry files
for (const [name, filePath] of Object.entries(entryPoints)) {
  if (!fs.existsSync(filePath)) {
    log.error(`${name}.js not found. Build cannot continue.`);
    process.exit(1);
  }
}

// Combined esbuild build for frontend source code
log.info("Bundling Electron scripts (index.js & preload.js) with esbuild...");
esbuild
  .build({
    entryPoints: entryPoints,
    outdir: distFolder,
    bundle: true,
    platform: "node",
    target: ["node16"],
    external: ["electron", "node-pty"],
    minify: true,
  })
  .then(() => log.success("All scripts bundled successfully!"))
  .catch((err) => {
    log.error("esbuild bundling failed.");
    log.error(err.message);
    process.exit(1);
  });

// Then doewnload all external binarys into bin

if (!fs.existsSync(binPath)) {
  log.info("Removing previous bin folder.");
  fs.rmSync(binPath, { recursive: true });
}

fs.mkdirSync(binPath, { recursive: true });
log.info("Making bin folder");

// download ripgrep deps into bin
try {
  log.info("Downloading ripgrep...");
  execSync("node scripts/install-ripgrep.js", { stdio: "inherit" }); // todo pass args from parent future for platform
  log.info("ripgrep binarys downloaded");
} catch (error) {
  log.error("Failed to download ripgrep binarys " + error);
  process.exit(1);
}

process.exit();
