/**
 * Self contained script to build desktop source code
 *
 * - Download deps
 * - Build typescript code -> raw JS
 * - Minify with esbuild
 * - Download external binarys with binman
 * - Copy needed files into dist
 */

import { spawn } from "child_process";
import { copyFile, mkdir, readFile, writeFile, cp } from "fs/promises";
import { dirname, join, basename } from "path";
import * as esbuild from "esbuild";
import { rm } from "fs/promises";

// Parse command line arguments
const args = process.argv.slice(2);
const isDev = args.includes("--dev");
const isProd = args.includes("--prod") || (!isDev && !args.includes("--dev"));

// Only minify in prod mode
const shouldMinify = isProd;

const commands = [
  ["npx", ["tsc"]],
  [
    "npx",
    [
      "binman",
      ".",
      `-platforms=${process.platform}`,
      `-architectures=${process.arch}`,
    ],
  ],
];

// Helper function to run a command and return a Promise
function runCommand([cmd, args]) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: "inherit",
      shell: true,
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}`));
        return;
      }
      resolve();
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}

// Clean  folders if they exist
async function clean() {
  const folders = ["./dist", "./staging", "./bin"];

  for (const folder of folders) {
    try {
      await rm(folder, { recursive: true, force: true });
      console.log(`✓ Removed ${folder}/`);
    } catch (err) {
      // If folder doesn't exist, that's fine
      if (err.code !== "ENOENT") {
        throw new Error(`Failed to remove ${folder}: ${err.message}`);
      }
    }
  }
}

async function copyTypesFile() {
  const sourcePath = "./src/type.ts";
  const destPath = "../ui/src/gen/type.ts";

  try {
    await mkdir(dirname(destPath), { recursive: true });
    await copyFile(sourcePath, destPath);
    console.log(`\n✓ Copied ${sourcePath} to ${destPath}`);
  } catch (err) {
    throw new Error(`Failed to copy types file: ${err.message}`);
  }
}

// WE do this becuase when generating it adds export {} at the end breaking preload load in browser
async function FixDistPreload() {
  const filePath = isDev ? "./dist/preload.js" : "./staging/preload.js";

  try {
    const content = await readFile(filePath, "utf-8");
    const lines = content.split("\n");

    // Filter out lines matching export { ... } pattern
    const filteredLines = lines.filter(
      (line) => !/export\s*\{[^}]*\}/.test(line),
    );

    const removedCount = lines.length - filteredLines.length;

    if (removedCount > 0) {
      await writeFile(filePath, filteredLines.join("\n"));
      console.log(
        `\n✓ Removed ${removedCount} export line(s) from ${filePath}`,
      );
    } else {
      console.log(`\nℹ No export lines found in ${filePath}`);
    }
  } catch (err) {
    throw new Error(`Failed to fix preload file: ${err.message}`);
  }
}

// Copy staging to dist in dev mode, or run esbuild in prod
async function copyStagingToDist() {
  try {
    console.log(`\nCopying staging/ to dist/ (dev mode - no bundling)...`);
    await cp("./staging", "./dist", { recursive: true, force: true });
    console.log("✓ Copied staging/ to dist/");
  } catch (err) {
    throw new Error(`Failed to copy staging to dist: ${err.message}`);
  }
}

// Run esbuild on staging/index.js to dist/index.js
async function buildIndex() {
  try {
    console.log(
      `\nBuilding staging/index.js -> dist/index.js${shouldMinify ? " (minified)" : " (unminified)"}...`,
    );
    await esbuild.build({
      entryPoints: ["./staging/index.js"],
      bundle: true,
      minify: shouldMinify,
      outfile: "dist/index.js",
      platform: "node",
      format: "esm",
      external: [
        "electron",
        "@homebridge/node-pty-prebuilt-multiarch",
        "node-logy",
        "typescript",
        "umbr-binman",
      ],
    });
    console.log("✓ Built dist/index.js");
  } catch (err) {
    throw new Error(`Failed to build index: ${err.message}`);
  }
}

// Run esbuild on staging/preload.js to dist/preload.js
async function buildPreload() {
  try {
    console.log(
      `\nBuilding staging/preload.js -> dist/preload.js${shouldMinify ? " (minified)" : " (unminified)"}...`,
    );
    await esbuild.build({
      entryPoints: ["./staging/preload.js"],
      bundle: true,
      minify: shouldMinify,
      outfile: "dist/preload.js",
      platform: "node",
      format: "esm",
      external: ["electron"],
    });
    console.log("✓ Built dist/preload.js");
  } catch (err) {
    throw new Error(`Failed to build preload: ${err.message}`);
  }
}

async function copyOverFilesToDist() {
  const filesToCopy = ["./.env", "package.json"];
  const distDir = "./dist";

  await mkdir(distDir, { recursive: true });

  await Promise.all(
    filesToCopy.map(async (file) => {
      const fileName = basename(file);
      const destination = join(distDir, fileName);
      await copyFile(file, destination);
      console.log(`Copied ${file} → ${destination}`);
    })
  );
}

(async () => {
  try {
    await clean();

    // Log build mode
    console.log(`\n🔨 Build mode: ${isProd ? "PRODUCTION" : "DEVELOPMENT"}`);
    if (isProd) {
      console.log("   Minification enabled");
    } else {
      console.log("   Minification disabled (fast copy mode)");
    }

    for (const [cmd, args] of commands) {
      console.log(`Running: ${cmd} ${args.join(" ")}`);
      await runCommand([cmd, args]);
    }

    await copyTypesFile();

    if (isDev) {
      // Dev mode: copy staging to dist, then fix preload in dist
      await copyStagingToDist();
      await FixDistPreload();
    } else {
      await FixDistPreload();
      await buildIndex();
      await buildPreload();
      await copyOverFilesToDist();
    }

    console.log("\n✅ All commands executed successfully!");
  } catch (err) {
    console.error("\n❌ Command failed:", err.message);
    process.exit(1);
  }
})();
