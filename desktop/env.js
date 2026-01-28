const fs = require("fs");
const path = require("path");
const { logger } = require("./logger");

/**
 * Helper util to load .env values into node process
 * @param {string} envFilePath Optional path for dev override
 */
function loadEnv(envFilePath = ".env") {
  let resolvedPath = path.resolve(envFilePath)

  if (!fs.existsSync(resolvedPath)) {
    logger.error("Failed to load env file for path " + resolvedPath)
    
    throw new Error("Failed to load .env file")
  }

  logger.info("Loaded .env file from " + resolvedPath)

  const envContent = fs.readFileSync(resolvedPath, "utf-8");

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
