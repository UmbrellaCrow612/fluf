const fs = require("fs");
const path = require("path");

/**
 * Helper util to load .env values into node process
 * @param {string} envFilePath Optional path for dev override
 */
function loadEnv(envFilePath = ".env") {
  let fullPath;

  // Detect if running inside ASAR
  const isProd = __dirname.includes("app.asar");

  if (isProd) {
    // In production, load from ASAR root
    fullPath = path.join(__dirname, ".env");
  } else {
    // In dev, use provided path relative to project root
    fullPath = path.resolve(process.cwd(), envFilePath);
  }

  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️  No .env file found at ${fullPath}`);
    return;
  }

  const envContent = fs.readFileSync(fullPath, "utf-8");

  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith("#")) return;

    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=").trim();

    // Remove quotes if any
    const cleanValue = value.replace(/^['"]|['"]$/g, "");

    process.env[key.trim()] = cleanValue;
  });
}

module.exports = {
  loadEnv,
};
