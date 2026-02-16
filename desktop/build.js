import { spawn } from "child_process";
import { copyFile, mkdir } from "fs/promises";
import { dirname } from "path";

const commands = [
  ['npx', ['tsc', '-p', '.\\tsconfig.json']],
  ['npx', ['tsc', '-p', '.\\tsconfig.preload.json']],
];

// Helper function to run a command and return a Promise
function runCommand([cmd, args]) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: 'inherit',  // This pipes stdout/stderr directly to parent
      shell: true        // Allows npx to work properly on Windows
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}`));
        return;
      }
      resolve();
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

async function copyTypesFile() {
  const sourcePath = 'dist/type.d.ts';
  const destPath = '../ui/gen/type.d.ts';
  
  try {
    // Ensure destination directory exists
    await mkdir(dirname(destPath), { recursive: true });
    
    // Copy the file
    await copyFile(sourcePath, destPath);
    console.log(`\n✓ Copied ${sourcePath} to ${destPath}`);
  } catch (err) {
    throw new Error(`Failed to copy types file: ${err.message}`);
  }
}

(async () => {
  try {
    for (const [cmd, args] of commands) {
      console.log(`\nRunning: ${cmd} ${args.join(' ')}\n`);
      await runCommand([cmd, args]);
    }
    
    await copyTypesFile();
    
    console.log("\nAll commands executed successfully!");
  } catch (err) {
    console.error("\nCommand failed:", err.message);
    process.exit(1);
  }
})();