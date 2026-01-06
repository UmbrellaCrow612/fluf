/**
 * Parses args passed to the build
 */

const { logError, logInfo } = require("./helper");

/**
 * @typedef {"linux" | "darwin" | "windows"} platform
 */

/**
 * @typedef {Object} parseResults
 * @property {platform} platform
 */

/**
 * Parses args passed to the build script
 * @returns {parseResults}
 */
const parse = () => {
  const args = process.argv.slice(2); // skip node and script name
  const platformArg = args.find((arg) => arg.startsWith("--platform="));

  if (!platformArg) {
    logError("Missing required flag --platform");
    process.exit(1);
  }

  const rawPlatform = platformArg.split("=")[1].toLowerCase();
  const allowedPlatforms = ["linux", "darwin", "windows"];

  if (!allowedPlatforms.includes(rawPlatform)) {
    logError(
      `Unknown platform "${rawPlatform}". Allowed values: ${allowedPlatforms.join(
        ", ",
      )}`,
    );
    process.exit(1);
  }

  /** @type {platform} */
  const platform = /** @type {platform} */ (rawPlatform);

  logInfo(`Platform set to "${platform}"`);
  return { platform };
};

module.exports = { parse };
