const https = require("https");
const fs = require("fs");
const path = require("path");

// Configuration
const RIPGREP_VERSION = "15.1.0";
const RIPGREP_URL = `https://github.com/BurntSushi/ripgrep/releases/download/${RIPGREP_VERSION}/ripgrep-${RIPGREP_VERSION}-x86_64-pc-windows-msvc.zip`;
const BIN_DIR = path.join(__dirname, "..", "bin");
const RG_EXE_PATH = path.join(BIN_DIR, "rg.exe");

async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);

    https
      .get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Follow redirect
          file.close();
          fs.unlinkSync(destPath);
          return downloadFile(response.headers.location, destPath)
            .then(resolve)
            .catch(reject);
        }

        if (response.statusCode !== 200) {
          file.close();
          fs.unlinkSync(destPath);
          return reject(
            new Error(`Failed to download: ${response.statusCode}`)
          );
        }

        response.pipe(file);

        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlinkSync(destPath);
        reject(err);
      });

    file.on("error", (err) => {
      fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

async function extractZip(zipPath, destDir) {
  const AdmZip = require("adm-zip");
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(destDir, true);
}

async function main() {
  try {
    console.log("Downloading ripgrep for Windows...");

    // Check if rg.exe already exists
    if (fs.existsSync(RG_EXE_PATH)) {
      console.log("Found existing rg.exe, removing it...");
      fs.unlinkSync(RG_EXE_PATH);
      console.log("Previous rg.exe removed");
    }

    // Create bin directory if it doesn't exist
    if (!fs.existsSync(BIN_DIR)) {
      fs.mkdirSync(BIN_DIR, { recursive: true });
      console.log(`Created directory: ${BIN_DIR}`);
    }

    // Download the zip file
    const zipPath = path.join(BIN_DIR, "ripgrep.zip");
    console.log(`Downloading from: ${RIPGREP_URL}`);

    await downloadFile(RIPGREP_URL, zipPath);
    console.log("Download complete!");

    // Extract the zip file
    console.log("Extracting files...");
    await extractZip(zipPath, BIN_DIR);

    // Move rg.exe from the extracted folder to bin root
    const extractedFolder = path.join(
      BIN_DIR,
      `ripgrep-${RIPGREP_VERSION}-x86_64-pc-windows-msvc`
    );
    const rgExePath = path.join(extractedFolder, "rg.exe");
    const finalRgPath = path.join(BIN_DIR, "rg.exe");

    if (fs.existsSync(rgExePath)) {
      fs.renameSync(rgExePath, finalRgPath);
      console.log(`Moved rg.exe to: ${finalRgPath}`);

      // Clean up extracted folder and zip
      fs.rmSync(extractedFolder, { recursive: true, force: true });
      fs.unlinkSync(zipPath);
      console.log("Cleaned up temporary files");
    }

    console.log("✓ Ripgrep installation complete!");
    console.log(`Binary location: ${finalRgPath}`);

    process.exit()
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
