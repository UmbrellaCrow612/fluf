/**
 * Clean ESBuild script to bundle app scripts into /dist.
 */

const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const log = {
  info: (/** @type {string}*/ msg) =>
    console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
  success: (/** @type {string}*/ msg) =>
    console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
  warn: (/** @type {string}*/ msg) =>
    console.log(`\x1b[33m[WARN]\x1b[0m ${msg}`),
  error: (/** @type {string}*/ msg) =>
    console.log(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
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

async function main() {
  // Install deps
  try {
    log.info("Installing deps...");
    execSync("npm ci", { stdio: "inherit" });
    log.success("Deps installed.");
  } catch (/** @type {any}*/ err) {
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
  } catch (/** @type {any}*/ err) {
    log.error("TypeScript failed: " + err.message);
    process.exit(1);
    return;
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
  } catch (/** @type {any}*/ err) {
    log.error("esbuild failed: " + err.message);
    process.exit(1);
  }

  // Run npm run binman
  log.info("Running `npm run binman`...");
  try {
    execSync("npm run binman", { stdio: "inherit" });
    log.success("binman completed.");
  } catch (/** @type {any}*/ err) {
    log.error("binman failed: " + err.message);
    process.exit(1);
  }
}

main().catch((err) => {
  log.error("Unexpected error:");
  log.error(err);
  process.exit(1);
});
