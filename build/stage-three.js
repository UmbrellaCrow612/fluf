const { Logger } = require("node-logy");
const { cleanExit } = require("./logger-helper");

const logger = new Logger({ saveToLogFiles: true, showCallSite: true });

const electronDownloadMap = {};

const platforms = {
  darwin: "darwin",
  linux: "linux",
  win32: "win32",
};

const archs = {
  arm: "arm",
  arm64: "arm64",
  x64: "x64",
};

/**
 * Downloads the electron binarys based on the current platform that is running and arch
 */
async function main() {
  try {
    // @ts-ignore
    if (!archs[process.arch]) {
      logger.error(
        "Current platform arch is not supported, supported are ",
        archs,
        "Provided: ",
        process.arch,
      );

      await cleanExit(logger, 1);
    }

    // @ts-ignore
    if (!platforms[process.platform]) {
      logger.error(
        "Platform not supported, supported are: ",
        platforms,
        "Provided: ",
        process.platform,
      );

      await cleanExit(logger, 1);
    }
  } catch (error) {
    logger.error("Failed stage three: ", error);
    await cleanExit(logger, 1);
  }
}

main();
