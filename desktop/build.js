import { spawn } from "child_process";
import { copyFile, mkdir, rename, rm, readFile, writeFile } from "fs/promises";
import { dirname } from "path";

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
  const destPath = "../ui/gen/type.ts";

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
  const filePath = "./dist/preload.js";

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

(async () => {
  try {
    for (const [cmd, args] of commands) {
      console.log(`\nRunning: ${cmd} ${args.join(" ")}\n`);
      await runCommand([cmd, args]);
    }

    await copyTypesFile();
    await FixDistPreload();

    console.log("\nAll commands executed successfully!");
  } catch (err) {
    console.error("\nCommand failed:", err.message);
    process.exit(1);
  }
})();
