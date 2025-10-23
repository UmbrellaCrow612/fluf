const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Get the directory where the script is located
const scriptDir = __dirname;

console.log("Starting reinstall process...");
console.log("Working directory:", scriptDir);

// Step 1: Delete node_modules
console.log("\n[1/7] Deleting node_modules...");
const nodeModulesPath = path.join(scriptDir, "node_modules");
if (fs.existsSync(nodeModulesPath)) {
  fs.rmSync(nodeModulesPath, { recursive: true, force: true });
  console.log("✓ node_modules deleted");
} else {
  console.log("✓ node_modules not found, skipping");
}

// Step 2: Delete package-lock.json
console.log("\n[2/7] Deleting package-lock.json...");
const packageLockPath = path.join(scriptDir, "package-lock.json");
if (fs.existsSync(packageLockPath)) {
  fs.unlinkSync(packageLockPath);
  console.log("✓ package-lock.json deleted");
} else {
  console.log("✓ package-lock.json not found, skipping");
}

// Step 3: Run nvm use 16
console.log("\n[3/7] Running nvm use 16...");
try {
  execSync("nvm use 16", { cwd: scriptDir, stdio: "inherit" });
  console.log("✓ Switched to Node 16");
} catch (error) {
  console.error("✗ Failed to run nvm use 16:", error.message);
  process.exit(1);
}

// Step 4: Remove electron-rebuild from package.json
console.log("\n[4/7] Removing electron-rebuild from package.json...");
const packageJsonPath = path.join(scriptDir, "package.json");
try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

  let removed = false;
  if (
    packageJson.dependencies &&
    packageJson.dependencies["electron-rebuild"]
  ) {
    delete packageJson.dependencies["electron-rebuild"];
    removed = true;
  }
  if (
    packageJson.devDependencies &&
    packageJson.devDependencies["electron-rebuild"]
  ) {
    delete packageJson.devDependencies["electron-rebuild"];
    removed = true;
  }

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log(
    removed
      ? "✓ electron-rebuild removed from package.json"
      : "✓ electron-rebuild not found in package.json"
  );
} catch (error) {
  console.error("✗ Failed to modify package.json:", error.message);
  process.exit(1);
}

// Step 5: Run npm install
console.log("\n[5/7] Running npm install...");
try {
  execSync("npm i", { cwd: scriptDir, stdio: "inherit" });
  console.log("✓ npm install completed");
} catch (error) {
  console.error("✗ Failed to run npm install:", error.message);
  process.exit(1);
}

// Step 6: Install electron-rebuild as dev dependency
console.log("\n[6/7] Installing electron-rebuild --save-dev...");
try {
  execSync("npm install electron-rebuild --save-dev", {
    cwd: scriptDir,
    stdio: "inherit",
  });
  console.log("✓ electron-rebuild installed");
} catch (error) {
  console.error("✗ Failed to install electron-rebuild:", error.message);
  process.exit(1);
}

// Step 7: Run electron-rebuild
console.log("\n[7/7] Running electron-rebuild...");
const electronRebuildPath = path.join(
  scriptDir,
  "node_modules",
  ".bin",
  "electron-rebuild.cmd"
);
try {
  execSync(`"${electronRebuildPath}"`, {
    cwd: scriptDir,
    stdio: "inherit",
  });
  console.log("✓ electron-rebuild completed");
} catch (error) {
  console.error("✗ Failed to run electron-rebuild:", error.message);
  process.exit(1);
}

console.log("\n✓ All steps completed successfully!");
