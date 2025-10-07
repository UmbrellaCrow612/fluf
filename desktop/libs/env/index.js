import fs from "fs";
import path from "path";

/**
 * Helper util to load .env values into node process
 * @param {string} envFilePath File path
 */
export function loadEnv(envFilePath = ".env") {
  const fullPath = path.resolve(process.cwd(), envFilePath);

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
