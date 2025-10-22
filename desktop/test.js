const {
  createShellImpl,
  cleanUpShells,
  stopCommandInShell,
  runCommandInShellImpl,
} = require("./shell");

(async () => {
  // Step 1: Create shell in your project directory
  const { id, shell } = await createShellImpl(null, __dirname);

  // Step 2: Run npm start
  console.log("Starting npm...");
  await runCommandInShellImpl(null, id, "node -v");

  // Wait a few seconds to simulate the server running
  setTimeout(() => {
    console.log("Stopping npm...");
    stopCommandInShell(undefined, id); 

    // Step 3: Run another command to show shell is still alive
    runCommandInShellImpl(null, id, "echo 'Shell is still alive!'");

    // Optional: clean up all shells after a delay
    setTimeout(() => {
      console.log("Cleaning up all shells...");
      cleanUpShells();
    }, 2000);
  }, 5000); 
})();
