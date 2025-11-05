/**
 * Script to install the binary for folder search and place in bin or replace it
 */

// download-fos.js
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const zipUrl =
  "https://github.com/user-attachments/files/23336840/fos_windows_amd64.zip";
const binDir = path.join(__dirname, "..", "bin");
const zipPath = path.join(binDir, "fos_windows_amd64.zip");

// Ensure bin directory exists
if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

console.log("📥 Downloading fos zip via PowerShell...");

try {
  // Download ZIP using PowerShell
  execSync(
    `powershell -Command "Invoke-WebRequest -Uri '${zipUrl}' -OutFile '${zipPath}'"`,
    { stdio: "inherit" }
  );

  console.log("✅ Download complete.");
  console.log("📦 Extracting ZIP...");

  // Extract ZIP using PowerShell
  execSync(
    `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${binDir}' -Force"`,
    { stdio: "inherit" }
  );

  console.log("✅ Extraction complete.");

  // Optionally, remove the ZIP file after extraction
  fs.unlinkSync(zipPath);
  console.log("🧹 Cleaned up ZIP file.");

  console.log(`🚀 fos binary installed to: ${binDir}`);
} catch (err) {
  console.error("❌ Error:", err.message);
  process.exit(1);
}
