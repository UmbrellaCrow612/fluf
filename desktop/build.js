/**
 * Clean ESBuild script to bundle app scripts into /dist.
 * Builds the project for a specific platform and runs binman accordingly.
 */

const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/** Logging utility */
const log = {
  /**
   * Info log
   * @param {string} msg
   */
  info: (msg) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
  /**
   * Success log
   * @param {string} msg
   */
  success: (msg) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
  /**
   * Warning log
   * @param {string} msg
   */
  warn: (msg) => console.log(`\x1b[33m[WARN]\x1b[0m ${msg}`),
  /**
   * Error log
   * @param {string} msg
   */
  error: (msg) => console.log(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
};

const distFolder = path.resolve(__dirname, "dist");
const envFile = path.resolve(__dirname, ".env");
const packageFile = path.resolve(__dirname, "package.json");
const distEnvFile = path.join(distFolder, ".env");
const distPackageFile = path.join(distFolder, "package.json");

const entryPoints = {
  index: path.resolve(__dirname, "index.js"),
  preload: path.resolve(__dirname, "preload.js"),
};

/** @type {string} Platform argument: linux, darwin, or windows */
const platform = process.argv[2]?.toLowerCase();
/** @type {string[]} Allowed platforms */
const allowedPlatforms = ["linux", "darwin", "windows"];

if (!platform || !allowedPlatforms.includes(platform)) {
  log.error(`Platform must be one of: ${allowedPlatforms.join(", ")}`);
  process.exit(1);
}

/**
 * Main build function
 */
async function main() {
  // Install deps
  try {
    log.info("Installing deps...");
    execSync("npm ci", { stdio: "inherit" });
    log.success("Deps installed.");
  } catch (/** @type {any} */ err) {
    log.error("Failed installing deps: " + err.message);
    process.exit(1);
  }

  // Clean dist
  if (fs.existsSync(distFolder)) {
    log.warn("Deleting existing dist folder...");
    fs.rmSync(distFolder, { recursive: true });
  }

  fs.mkdirSync(distFolder);
  log.success("dist folder created.");

  // TypeScript compile
  try {
    log.info("Running TypeScript compiler...");
    execSync("npx tsc", { stdio: "inherit" });
    log.success("TypeScript compiled.");
  } catch (/** @type {any} */ err) {
    log.error("TypeScript failed: " + err.message);
    process.exit(1);
  }

  // Copy .env
  if (!fs.existsSync(envFile)) {
    log.error(".env not found, stopping build.");
    process.exit(1);
  }
  fs.copyFileSync(envFile, distEnvFile);

  // Copy package.json
  if (!fs.existsSync(packageFile)) {
    log.error("package.json not found, stopping build.");
    process.exit(1);
  }
  fs.copyFileSync(packageFile, distPackageFile);
  log.success("Config files copied.");

  // Validate entry files
  for (const [name, file] of Object.entries(entryPoints)) {
    if (!fs.existsSync(file)) {
      log.error(`${name}.js not found!`);
      process.exit(1);
    }
  }

  // ESBuild
  log.info("Bundling with esbuild...");
  try {
    await esbuild.build({
      entryPoints,
      outdir: distFolder,
      bundle: true,
      platform: "node",
      target: ["node20"],
      external: ["electron", "node-pty"],
      minify: true,
    });

    log.success("esbuild bundling complete!");
  } catch (/** @type {any} */ err) {
    log.error("esbuild failed: " + err.message);
    process.exit(1);
  }

  // Run npm run binman for the specific platform
  const binmanCmd = `npm run binman:${platform}`;
  log.info(`Running \`${binmanCmd}\`...`);
  try {
    execSync(binmanCmd, { stdio: "inherit" });
    log.success(`binman for ${platform} completed.`);
  } catch (/** @type {any} */ err) {
    log.error(`binman for ${platform} failed: ${err.message}`);
    process.exit(1);
  }
}

main().catch((err) => {
  log.error("Unexpected error:");
  log.error(err);
  process.exit(1);
});
