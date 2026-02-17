import { spawn } from "child_process";
import { copyFile, mkdir, rename, rm } from "fs/promises";
import { dirname } from "path";

const commands = [
  ["npx", ["tsc", "-p", ".\\tsconfig.json"]],
  ["npx", ["tsc", "-p", ".\\tsconfig.preload.json"]],
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

async function movePreloadFile() {
  const sourcePath = "./dist/preload/preload.js";
  const destPath = "./dist/preload.js";
  const preloadDir = "./dist/preload";

  try {
    await rename(sourcePath, destPath);
    console.log(`\n✓ Moved ${sourcePath} to ${destPath}`);

    await rm(preloadDir, { recursive: true, force: true });
    console.log(`✓ Deleted ${preloadDir} directory`);
  } catch (err) {
    throw new Error(`Failed to move preload file: ${err.message}`);
  }
}

(async () => {
  try {
    for (const [cmd, args] of commands) {
      console.log(`\nRunning: ${cmd} ${args.join(" ")}\n`);
      await runCommand([cmd, args]);
    }

    await movePreloadFile();
    await copyTypesFile();

    console.log("\nAll commands executed successfully!");
  } catch (err) {
    console.error("\nCommand failed:", err.message);
    process.exit(1);
  }
})();
