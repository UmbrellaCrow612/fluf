import { Logger } from "node-logy";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { safeExit } from "./utils.js";
import { runCommand, safeRun } from "node-github-actions";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const isDev = args.includes("--dev");

const logger = new Logger({
  saveToLogFiles: true,
  showCallSite: true,
  callSiteOptions: { fullFilePath: true },
});

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
const envFilePath = path.join(__dirname, "../.env");

/** @type {string[]} */
const staticFilePathsToCopy = [packageJsonPath, envFilePath];

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
    external: ["electron", ...externals],
  });
}

safeRun(
  async () => {
    logger.info("Building desktop source code");

    // Clean previous dist
    logger.info(`Cleaning previous dist at ${distPath}`);
    await fs.rm(distPath, { recursive: true, force: true });
    logger.info("Previous dist cleaned");

    // Clean previous staging
    logger.info(`Cleaning previous staging at ${stagingPath}`);
    await fs.rm(stagingPath, { recursive: true, force: true });
    logger.info("Previous staging cleaned");

    // Clean previous bin folder
    logger.info(`Cleaning previous bin folder at ${binPath}`);
    await fs.rm(binPath, { recursive: true, force: true });
    logger.info("Previous bin cleaned");

    // Build TypeScript source code
    logger.info("Building TypeScript source code into JavaScript");
    await runCommand("npx", ["tsc"], {}, 60);
    logger.info("TypeScript compilation completed");

    // Download binaries
    logger.info("Downloading binaries");
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
    logger.info("Binaries downloaded");

    // Copy type file to UI
    logger.info(
      `Copying desktop types from ${typeFilePath} to ${typeFileDestination}`,
    );
    await fs.access(typeFilePath);
    await fs.copyFile(typeFilePath, typeFileDestination);
    logger.info("Desktop types copied");

    // Fix preload script
    logger.info(`Fixing preload JS file at ${preloadFilePath}`);
    await fs.access(preloadFilePath);
    const content = await fs.readFile(preloadFilePath, "utf-8");
    const lines = content.split("\n");
    const filteredLines = lines.filter(
      (line) => !/export\s*\{[^}]*\}/.test(line),
    );
    const removedCount = lines.length - filteredLines.length;

    if (removedCount > 0) {
      await fs.writeFile(preloadFilePath, filteredLines.join("\n"));
      logger.info(`Removed ${removedCount} export line(s) from preload`);
    }
    logger.info("Preload JS file fixed");

    // Read package.json and get dependency names as an array
    logger.info(`Reading package.json at ${packageJsonPath}`);
    const fileContent = await fs.readFile(packageJsonPath, "utf-8");
    const asJson = JSON.parse(fileContent);

    const depObject = asJson?.dependencies;
    if (!depObject) {
      throw new Error("package.json does not have a dependencies section");
    }

    const packageJsonDeps = Object.keys(depObject);
    logger.info(`Found ${packageJsonDeps.length} dependencies`);

    if (isDev) {
      logger.info("Building for dev");

      // Just copy over staging -> dist
      await fs.cp(stagingPath, distPath, { recursive: true });
      logger.info("Copied staging to dist for dev build");
    } else {
      logger.info("Building for production");

      // Bundle index.js with esbuild
      logger.info(`Bundling ${stagingIndexJsFilePath}`);
      await bundleWithEsbuild(
        stagingIndexJsFilePath,
        stagingIndexJsFileDestinationPath,
        packageJsonDeps,
      );
      logger.info("Bundled index.js");

      // Bundle preload.js with esbuild
      logger.info(`Bundling ${stagingPreloadJsFile}`);
      await bundleWithEsbuild(
        stagingPreloadJsFile,
        stagingPreloadJsFileDestinationPath,
        packageJsonDeps,
      );
      logger.info("Bundled preload.js");
    }

    if (isDev) {
      logger.info("Created .env file in dev mode ", envFilePath);
      await fs.writeFile(
        envFilePath,
        "MODE=dev\nDEV_UI_PORT=http://localhost:4200/\nTEST=false",
        { encoding: "utf-8" },
      );
    } else {
      logger.info("Created .env file in prod mode ", envFilePath);
      await fs.writeFile(
        envFilePath,
        "MODE=prod\nDEV_UI_PORT=http://localhost:4200/\nTEST=false",
        { encoding: "utf-8" },
      );
    }

    // Copy static files
    logger.info("Copying static files");
    for (const filePath of staticFilePathsToCopy) {
      const destPath = path.join(distPath, path.basename(filePath));
      logger.info(`Copying file from ${filePath} to ${destPath}`);
      await fs.copyFile(filePath, destPath);
    }
    logger.info("Static files copied");

    logger.info("Desktop build completed successfully");
  },
  {
    exitFailCode: 1,
    exitOnFailed: true,
    onBefore: () => {
      logger.info("Started desktop build");
    },
    onAfter: async () => {
      await safeExit(logger);
    },
    onFail: async (err) => {
      logger.error("Desktop build failed ", err);
      await safeExit(logger);
    },
    timeoutMs: 3 * 60 * 1000,
  },
);
