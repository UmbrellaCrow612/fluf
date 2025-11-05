// install-ripgrep.js
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const RIPGREP_VERSION = "15.1.0";
const RIPGREP_URL = `https://github.com/BurntSushi/ripgrep/releases/download/${RIPGREP_VERSION}/ripgrep-${RIPGREP_VERSION}-x86_64-pc-windows-msvc.zip`;

const BIN_DIR = path.join(__dirname, "..", "bin");
const ZIP_PATH = path.join(BIN_DIR, "ripgrep.zip");
const EXTRACTED_DIR = path.join(
  BIN_DIR,
  `ripgrep-${RIPGREP_VERSION}-x86_64-pc-windows-msvc`
);
const RG_EXE_PATH = path.join(BIN_DIR, "rg.exe");

function runPowerShell(command) {
  execSync(
    `powershell -NoProfile -ExecutionPolicy Bypass -Command "${command}"`,
    {
      stdio: "inherit",
    }
  );
}

async function main() {
  try {
    console.log("📦 Installing ripgrep via PowerShell...");

    // Remove existing rg.exe if present
    if (fs.existsSync(RG_EXE_PATH)) {
      console.log("🧹 Removing existing rg.exe...");
      fs.unlinkSync(RG_EXE_PATH);
    }

    // Ensure bin directory exists
    if (!fs.existsSync(BIN_DIR)) {
      fs.mkdirSync(BIN_DIR, { recursive: true });
      console.log(`📁 Created directory: ${BIN_DIR}`);
    }

    // Download zip using PowerShell
    console.log("📥 Downloading ripgrep...");
    runPowerShell(
      `Invoke-WebRequest -Uri '${RIPGREP_URL}' -OutFile '${ZIP_PATH}'`
    );

    // Extract zip using PowerShell
    console.log("📂 Extracting archive...");
    runPowerShell(
      `Expand-Archive -Path '${ZIP_PATH}' -DestinationPath '${BIN_DIR}' -Force`
    );

    // Move rg.exe to bin root
    const extractedExePath = path.join(EXTRACTED_DIR, "rg.exe");
    if (fs.existsSync(extractedExePath)) {
      fs.renameSync(extractedExePath, RG_EXE_PATH);
      console.log(`✅ Moved rg.exe to: ${RG_EXE_PATH}`);

      // Clean up
      fs.rmSync(EXTRACTED_DIR, { recursive: true, force: true });
      fs.unlinkSync(ZIP_PATH);
      console.log("🧹 Cleaned up temporary files.");
    } else {
      throw new Error("rg.exe not found after extraction.");
    }

    console.log("🎉 Ripgrep installation complete!");
    console.log(`Binary location: ${RG_EXE_PATH}`);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

main();
