/**
 * Self-contained script to build desktop source code
 *
 * - Download deps
 * - Build typescript code -> raw JS
 * - Minify with esbuild
 * - Download external binaries with binman
 * - Copy needed files into dist
 */

import { spawn } from "child_process";
import { copyFile, mkdir, readFile, writeFile, cp, rm } from "fs/promises";
import { dirname, join, basename } from "path";
import * as esbuild from "esbuild";

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  dirs: {
    dist: "./dist",
    staging: "./staging",
    bin: "./bin",
  },
  files: {
    typeSource: "./src/type.ts",
    typeDest: "../ui/src/gen/type.ts",
    env: "./.env",
    packageJson: "package.json",
  },
  esbuild: {
    index: { entry: "./staging/index.js", out: "dist/index.js" },
    preload: { entry: "./staging/preload.js", out: "dist/preload.js" },
  },
  externals: {
    index: [
      "electron",
      "@homebridge/node-pty-prebuilt-multiarch",
      "node-logy",
      "typescript",
      "umbr-binman",
    ],
    preload: ["electron"],
  },
};

// ============================================================================
// CLI Parsing
// ============================================================================

const args = process.argv.slice(2);
const isDev = args.includes("--dev");
const isProd = args.includes("--prod") || (!isDev && !args.includes("--dev"));
const shouldMinify = isProd;

// ============================================================================
// Command Runner
// ============================================================================

function runCommand(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: "inherit",
      shell: true,
      ...options,
    });

    child.on("close", (code) => {
      if (code !== 0)
        reject(new Error(`Command failed with exit code ${code}`));
      else resolve();
    });

    child.on("error", reject);
  });
}

// ============================================================================
// Build Steps
// ============================================================================

async function clean() {
  await Promise.all(
    Object.values(CONFIG.dirs).map(async (dir) => {
      try {
        await rm(dir, { recursive: true, force: true });
        console.log(`✓ Removed ${dir}/`);
      } catch (err) {
        if (err.code !== "ENOENT")
          throw new Error(`Failed to remove ${dir}: ${err.message}`);
      }
    }),
  );
}

async function compileTypeScript() {
  console.log("\n📦 Compiling TypeScript...");
  await runCommand("npx", ["tsc"]);
}

async function downloadBinaries() {
  console.log("\n⬇️  Downloading binaries...");
  await runCommand("npx", [
    "binman",
    ".",
    `-platforms=${process.platform}`,
    `-architectures=${process.arch}`,
  ]);
}

async function copyTypesFile() {
  const { typeSource, typeDest } = CONFIG.files;
  await mkdir(dirname(typeDest), { recursive: true });
  await copyFile(typeSource, typeDest);
  console.log(`✓ Copied types to ${typeDest}`);
}

// Remove `export {}` from preload (breaks browser preload loading)
async function fixPreloadFile() {
  const filePath = isDev ? "./dist/preload.js" : "./staging/preload.js";
  const content = await readFile(filePath, "utf-8");
  const lines = content.split("\n");
  const filteredLines = lines.filter(
    (line) => !/export\s*\{[^}]*\}/.test(line),
  );
  const removedCount = lines.length - filteredLines.length;

  if (removedCount > 0) {
    await writeFile(filePath, filteredLines.join("\n"));
    console.log(`✓ Removed ${removedCount} export line(s) from preload`);
  }
}

async function copyStagingToDist() {
  console.log("\n📋 Copying staging/ to dist/ (dev mode)...");
  await cp(CONFIG.dirs.staging, CONFIG.dirs.dist, {
    recursive: true,
    force: true,
  });
  console.log("✓ Copied staging/ to dist/");
}

async function bundleWithEsbuild({ entry, out }, externals) {
  const outPath = `./${out}`;
  console.log(
    `\n🔨 Bundling ${entry} -> ${outPath}${shouldMinify ? " (minified)" : ""}...`,
  );

  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    minify: shouldMinify,
    outfile: outPath,
    platform: "node",
    format: "esm",
    external: externals,
  });

  console.log(`✓ Built ${outPath}`);
}

async function copyStaticFiles() {
  const { dist } = CONFIG.dirs;
  const filesToCopy = [CONFIG.files.env, CONFIG.files.packageJson];

  await mkdir(dist, { recursive: true });

  await Promise.all(
    filesToCopy.map(async (file) => {
      const dest = join(dist, basename(file));
      await copyFile(file, dest);
      console.log(`✓ Copied ${basename(file)}`);
    }),
  );
}

function logBuildMode() {
  console.log(`\n🔨 Build mode: ${isProd ? "PRODUCTION" : "DEVELOPMENT"}`);
  console.log(`   Minification: ${shouldMinify ? "enabled" : "disabled"}`);
}

// ============================================================================
// Build Orchestration
// ============================================================================

async function runDevBuild() {
  await compileTypeScript();
  await downloadBinaries();
  await copyTypesFile();
  await copyStagingToDist();
  await fixPreloadFile();
  await copyStaticFiles();
}

async function runProdBuild() {
  await compileTypeScript();
  await downloadBinaries();
  await copyTypesFile();
  await fixPreloadFile();

  await bundleWithEsbuild(CONFIG.esbuild.index, CONFIG.externals.index);
  await bundleWithEsbuild(CONFIG.esbuild.preload, CONFIG.externals.preload);

  await copyStaticFiles();
}

// ============================================================================
// Main
// ============================================================================

(async () => {
  try {
    await clean();
    logBuildMode();

    if (isDev) await runDevBuild();
    else await runProdBuild();

    console.log("\n✅ Build completed successfully!");
  } catch (err) {
    console.error("\n❌ Build failed:", err.message);
    process.exit(1);
  }
})();
