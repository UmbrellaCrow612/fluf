import { spawn } from "child_process";
import { copyFile, mkdir, readFile, writeFile } from "fs/promises";
import { dirname } from "path";
import * as esbuild from "esbuild";

const commands = [["npx", ["tsc", "-p", ".\\tsconfig.json"]]];

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
  const filePath = "./staging/preload.js";

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

// Run esbuild on staging/index.js to dist/index.js
async function buildIndex() {
  try {
    console.log("\nBuilding staging/index.js -> dist/index.js...");
    await esbuild.build({
      entryPoints: ["./staging/index.js"],
      bundle: true,
      minify:true,
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
    console.log("\nBuilding staging/preload.js -> dist/preload.js...");
    await esbuild.build({
      entryPoints: ["./staging/preload.js"],
      bundle: true,
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

(async () => {
  try {
    for (const [cmd, args] of commands) {
      console.log(`\nRunning: ${cmd} ${args.join(" ")}\n`);
      await runCommand([cmd, args]);
    }

    await copyTypesFile();
    await FixDistPreload();
    await buildIndex();
    await buildPreload();

    console.log("\nAll commands executed successfully!");
  } catch (err) {
    console.error("\nCommand failed:", err.message);
    process.exit(1);
  }
})();
