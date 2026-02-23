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
const typeFileDestiniation = path.join(__dirname, "../../ui/src/gen/type.ts");
const preloadFilePath = path.join(stagingPath, "preload.js");
const packageJsonPath = path.join(__dirname, "../package.json");
const stagingIndexJsFilePath = path.join(stagingPath, "index.js");
const stagingIndexJsFileDestinationPath = path.join(distPath, "index.js");
const stagingPreloadJsFile = path.join(stagingPath, "preload.js");
const stagingPreloadJsFileDestiniationPath = path.join(distPath, "preload.js");

/** @type {string[]} */
const staticFilePathsToCopy = [packageJsonPath];

/**
 * Bundle a file
 * @param {string} targetPath - Path to the target file
 * @param {string} outputPath - Path to the output path
 * @param {string[]} externals - Array fo external modules not to bundle
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
      await fs.promises.rm(distPath, { recursive: true });
    },
    logger,
    `Failed to clean previous dist at ${distPath}`,
  );

  logger.info(`Cleaning previous staging at ${stagingPath}`);
  await safeRun(
    async () => {
      await fs.promises.rm(stagingPath, { recursive: true });
    },
    logger,
    `Failed to clean previous staging at ${stagingPath}`,
  );

  logger.info(`Cleaning previous bin folder at: ${binPath}`);
  await safeRun(
    async () => {
      await fs.promises.rm(binPath, { recursive: true });
    },
    logger,
    `Failed to clean previous bin at ${binPath}`,
  );

  // Build ts source code
  logger.info("Building typescript source code into javascript");
  await safeRun(
    async () => {
      await runCommand("npx", ["tsc"], {}, 60);
    },
    logger,
    "Failed to run typescript compliation",
  );

  // Download binary's
  logger.info("Downloading binarys");
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
    "Failed to run download binarys",
  );

  // Copy type file to UI
  logger.info(
    `Copying desktop types from: ${typeFilePath} to: ${typeFileDestiniation}`,
  );
  await safeRun(
    async () => {
      await fs.promises.access(typeFilePath);
      await fs.promises.copyFile(typeFilePath, typeFileDestiniation);
    },
    logger,
    `Failed to copy desktop types from: ${typeFilePath} to: ${typeFileDestiniation}`,
  );

  // Fix preload script
  logger.info(`Fixing preload js file at: ${preloadFilePath}`);
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
    `Failed to fix preload js file at: ${preloadFilePath}`,
  );

  // Read package.json and get it's deps names as string array for example ["node-logy", "@homebridge", ....]
  // So we can ignore them in esbuild bundle step
  logger.info(`Reading package json file at ${packageJsonPath}`);
  /** @type {string[]} */
  let packageJsonDeps = [];

  await safeRun(
    async () => {
      let fileContent = await fs.promises.readFile(packageJsonPath, {
        encoding: "utf-8",
      });
      let asJson = JSON.parse(fileContent);

      let depObject = asJson?.dependencies;
      if (!depObject) {
        throw new Error("package.json does not have dependencies section");
      }

      packageJsonDeps = Object.keys(depObject);

      packageJsonDeps.forEach((dep) => {
        if (typeof dep !== "string") {
          throw new Error(
            "Not all package.json dependencies are string valuesF",
          );
        }
      });
    },
    logger,
    `Failed to read package json file at ${packageJsonPath}`,
  );

  // Build index.js with esbuild
  logger.info(`bunderling ${stagingIndexJsFilePath}`);
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

  // Build preload.js with esbuild
  logger.info(`Bundlering ${stagingPreloadJsFile}`);
  await safeRun(
    async () => {
      await bundleWithEsbuild(
        stagingPreloadJsFile,
        stagingPreloadJsFileDestiniationPath,
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
        logger.info(`Copying file from: ${filePath} to: ${destPath}`);

        await fs.promises.copyFile(filePath, destPath);
      }
    },
    logger,
    `Failed to copy static files`,
  );

  // Exit
  await safeExit(logger, 0);
}

main();
