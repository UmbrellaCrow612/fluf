import { Logger } from "node-logy";
import { runCommand, safeExit, safeRun } from "./utils.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs";
import * as esbuild from "esbuild";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = new Logger({ saveToLogFiles: true, showCallSite: true });

const distPath = path.join(__dirname, "../dist");
const binPath = path.join(__dirname, "../bin");
const stagingPath = path.join(__dirname, "../staging");

const typeFilePath = path.join(__dirname, "../src/type.ts");
const typeFileDestination = path.join(__dirname, "../../ui/src/gen/type.ts");
const preloadFilePath = path.join(stagingPath, "preload.js");
const packageJsonPath = path.join(__dirname, "../package.json");
const stagingIndexJsFilePath = path.join(stagingPath, "index.js");
const stagingIndexJsFileDestinationPath = path.join(distPath, "index.js");
const stagingPreloadJsFile = path.join(stagingPath, "preload.js");
const stagingPreloadJsFileDestinationPath = path.join(distPath, "preload.js");

/** @type {string[]} */
const staticFilePathsToCopy = [packageJsonPath];

/**
 * Bundle a file.
 * @param {string} targetPath - Path to the target file.
 * @param {string} outputPath - Path to the output file.
 * @param {string[]} externals - Array of external modules not to bundle.
 * @returns {Promise<void>}
 */
async function bundleWithEsbuild(targetPath, outputPath, externals) {
  await esbuild.build({
    entryPoints: [targetPath],
    bundle: true,
    minify: true,
    outfile: outputPath,
    platform: "node",
    format: "esm",
    external: externals,
  });
}

async function main() {
  logger.info("Building desktop source code");

  logger.info(`Cleaning previous dist at ${distPath}`);
  await safeRun(
    async () => {
      await fs.promises.rm(distPath, { recursive: true, force: true });
    },
    logger,
    `Failed to clean previous dist at ${distPath}`,
  );

  logger.info(`Cleaning previous staging at ${stagingPath}`);
  await safeRun(
    async () => {
      await fs.promises.rm(stagingPath, { recursive: true, force: true });
    },
    logger,
    `Failed to clean previous staging at ${stagingPath}`,
  );

  logger.info(`Cleaning previous bin folder at ${binPath}`);
  await safeRun(
    async () => {
      await fs.promises.rm(binPath, { recursive: true, force: true });
    },
    logger,
    `Failed to clean previous bin at ${binPath}`,
  );

  // Build TypeScript source code
  logger.info("Building TypeScript source code into JavaScript");
  await safeRun(
    async () => {
      await runCommand("npx", ["tsc"], {}, 60);
    },
    logger,
    "Failed to run TypeScript compilation",
  );

  // Download binaries
  logger.info("Downloading binaries");
  await safeRun(
    async () => {
      await runCommand(
        "npx",
        [
          "binman",
          ".",
          `-platforms=${process.platform}`,
          `-architectures=${process.arch}`,
        ],
        {},
        60,
      );
    },
    logger,
    "Failed to download binaries",
  );

  // Copy type file to UI
  logger.info(
    `Copying desktop types from ${typeFilePath} to ${typeFileDestination}`,
  );
  await safeRun(
    async () => {
      await fs.promises.access(typeFilePath);
      await fs.promises.copyFile(typeFilePath, typeFileDestination);
    },
    logger,
    `Failed to copy desktop types from ${typeFilePath} to ${typeFileDestination}`,
  );

  // Fix preload script
  logger.info(`Fixing preload JS file at ${preloadFilePath}`);
  await safeRun(
    async () => {
      await fs.promises.access(preloadFilePath);
      const content = await fs.promises.readFile(preloadFilePath, "utf-8");
      const lines = content.split("\n");
      const filteredLines = lines.filter(
        (line) => !/export\s*\{[^}]*\}/.test(line),
      );
      const removedCount = lines.length - filteredLines.length;

      if (removedCount > 0) {
        await fs.promises.writeFile(preloadFilePath, filteredLines.join("\n"));
        logger.info(`Removed ${removedCount} export line(s) from preload`);
      }
    },
    logger,
    `Failed to fix preload JS file at ${preloadFilePath}`,
  );

  // Read package.json and get dependency names as an array
  logger.info(`Reading package.json at ${packageJsonPath}`);
  /** @type {string[]} */
  let packageJsonDeps = [];

  await safeRun(
    async () => {
      const fileContent = await fs.promises.readFile(packageJsonPath, "utf-8");
      const asJson = JSON.parse(fileContent);

      const depObject = asJson?.dependencies;
      if (!depObject) {
        throw new Error("package.json does not have a dependencies section");
      }

      packageJsonDeps = Object.keys(depObject);

      packageJsonDeps.forEach((dep) => {
        if (typeof dep !== "string") {
          throw new Error("All package.json dependencies must be strings");
        }
      });
    },
    logger,
    `Failed to read package.json at ${packageJsonPath}`,
  );

  // Bundle index.js with esbuild
  logger.info(`Bundling ${stagingIndexJsFilePath}`);
  await safeRun(
    async () => {
      await bundleWithEsbuild(
        stagingIndexJsFilePath,
        stagingIndexJsFileDestinationPath,
        packageJsonDeps,
      );
    },
    logger,
    `Failed to bundle ${stagingIndexJsFilePath}`,
  );

  // Bundle preload.js with esbuild
  logger.info(`Bundling ${stagingPreloadJsFile}`);
  await safeRun(
    async () => {
      await bundleWithEsbuild(
        stagingPreloadJsFile,
        stagingPreloadJsFileDestinationPath,
        packageJsonDeps,
      );
    },
    logger,
    `Failed to bundle ${stagingPreloadJsFile}`,
  );

  // Copy static files
  logger.info("Copying static files");
  await safeRun(
    async () => {
      for (const filePath of staticFilePathsToCopy) {
        const destPath = path.join(distPath, path.basename(filePath));
        logger.info(`Copying file from ${filePath} to ${destPath}`);
        await fs.promises.copyFile(filePath, destPath);
      }
    },
    logger,
    "Failed to copy static files",
  );

  // Exit
  await safeExit(logger, 0);
}

main();
