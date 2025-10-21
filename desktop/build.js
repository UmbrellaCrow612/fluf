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

const entryPoints = {
  index: path.resolve(__dirname, "index.js"),
  preload: path.resolve(__dirname, "preload.js"),
};

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

// Combined esbuild build
log.info("Bundling Electron scripts (index.js & preload.js) with esbuild...");
esbuild
  .build({
    entryPoints: entryPoints,
    outdir: distFolder,
    bundle: true,
    platform: "node",
    target: ["node16"],
    external: ["electron"],
    minify: true,
  })
  .then(() => log.success("All scripts bundled successfully!"))
  .catch((err) => {
    log.error("esbuild bundling failed.");
    log.error(err.message);
    process.exit(1);
  });
