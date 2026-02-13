const { spawn } = require('child_process');

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`\n▶ Running: ${command} ${args.join(' ')}\n`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}`));
      } else {
        resolve();
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  try {
    // Step 1: Compile TypeScript
    await runCommand('npx', ['tsc']);
    
    // Step 2: Run Electron
    await runCommand('npx', ['electron', '.']);
  } catch (error) {
    console.error('\n✖ Error:', error.message);
    process.exit(1);
  }
}

main();