/**
 * Es Build to compile all js files into a single one for easier building and packing
 */

const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

// Define paths
const distFolder = path.resolve(__dirname, "dist");
const envFile = path.resolve(__dirname, ".env");
const packageFile = path.resolve(__dirname, "package.json");
const distEnvFile = path.join(distFolder, ".env");
const distPackageFile = path.join(distFolder, "package.json");

// Ensure dist folder exists
if (!fs.existsSync(distFolder)) {
  fs.mkdirSync(distFolder);
}

// Copy .env if it exists
if (fs.existsSync(envFile)) {
  fs.copyFileSync(envFile, distEnvFile);
  console.log(".env file copied to dist folder");
} else {
  console.warn(".env file not found");
}

// Copy package.json if it exists
if (fs.existsSync(packageFile)) {
  fs.copyFileSync(packageFile, distPackageFile);
  console.log("package.json copied to dist folder");
} else {
  console.warn("package.json file not found");
}

// Build with esbuild
esbuild
  .build({
    entryPoints: ["index.js"], // your Electron main file
    bundle: true, // bundle all imports/requires
    platform: "node", // Electron main process runs in Node
    target: ["node16"], // adjust Node version as needed
    outfile: "dist/index.js", // output bundled file
    external: ["electron"], // don't bundle electron itself
    minify: true, // optional: minify for smaller file
  })
  .then(() => console.log("Build successful"))
  .catch(() => process.exit(1));
