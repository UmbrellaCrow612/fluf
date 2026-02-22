const { Logger } = require("node-logy");
const { cleanExit } = require("./logger-helper");
const fs = require("fs/promises");
const {
  DESKTOP_BIN_PATH,
  DESKTOP_PACKAGE_JSON_PATH,
  DESKTOP_NODE_MODULES_PATH,
  DESKTOP_ENV_FILE,
} = require("./desktop_uris");
const {
  STAGE_THREE_DIST_RESOURCE_BIN,
  STAGE_THREE_DIST_RESOURCE_NODE_MODULES,
  STAGE_THREE_DIST_RESOURCE,
  STAGE_THREE_DIST,
  STAGE_THREE_ELECTRON_EXE_PATH,
  STAGE_THREE_FLUF_EXE_PATH,
} = require("./stage_three_uris");
const path = require("path");

const logger = new Logger({ saveToLogFiles: true, showCallSite: true });

/**
 * Moves desktop bin and require node_modules to stage three resoucres folder
 */
async function main() {
  logger.info("Started stage four");

  logger.info("Checking if desktop bin path exists: ", DESKTOP_BIN_PATH);
  try {
    await fs.access(DESKTOP_BIN_PATH);
  } catch (error) {
    logger.error(
      "Failed to check if desktop bin exists at: ",
      DESKTOP_BIN_PATH,
      error,
    );
    await cleanExit(logger, 1);
  }

  logger.info(
    "Copying bin path: ",
    DESKTOP_BIN_PATH,
    " To: ",
    STAGE_THREE_DIST_RESOURCE_BIN,
  );

  try {
    await fs.cp(DESKTOP_BIN_PATH, STAGE_THREE_DIST_RESOURCE_BIN, {
      recursive: true,
    });
  } catch (error) {
    logger.error(
      "Failed to copy: ",
      DESKTOP_BIN_PATH,
      " To: ",
      STAGE_THREE_DIST_RESOURCE_BIN,
      error,
    );
    await cleanExit(logger, 1);
  }

  const envDestination = path.join(STAGE_THREE_DIST, ".env");
  logger.info(
    "Copying .env into resoucres from: ",
    DESKTOP_ENV_FILE,
    " to: ",
    envDestination,
  );
  try {
    await fs.access(DESKTOP_ENV_FILE);

    await fs.copyFile(DESKTOP_ENV_FILE, envDestination);
  } catch (error) {
    logger.error(
      "Failed to copy desktop .env to resoucres from: ",
      DESKTOP_ENV_FILE,
      " to: ",
      envDestination,
      error,
    );
    await cleanExit(logger, 1);
  }

  logger.info("Starting to copy desktop node_module depencies");

  logger.info("Checking if path exists: ", DESKTOP_PACKAGE_JSON_PATH);
  try {
    await fs.access(DESKTOP_PACKAGE_JSON_PATH);
  } catch (error) {
    logger.error(
      "Failed to check if ",
      DESKTOP_PACKAGE_JSON_PATH,
      " exists: ",
      error,
    );
    await cleanExit(logger, 1);
  }

  logger.info("Reading package json file contents");

  let DesktopPackageJson = null;
  try {
    let content = await fs.readFile(DESKTOP_PACKAGE_JSON_PATH, {
      encoding: "utf-8",
    });
    DesktopPackageJson = JSON.parse(content);
  } catch (error) {
    logger.error("Failed to read ", DESKTOP_PACKAGE_JSON_PATH);
    await cleanExit(logger, 1);
  }

  if (!DesktopPackageJson || typeof DesktopPackageJson !== "object") {
    logger.error(
      "Content read from ",
      DESKTOP_PACKAGE_JSON_PATH,
      " is not a object",
    );
    await cleanExit(logger, 1);
  }

  if (!DesktopPackageJson.dependencies) {
    logger.error("Desktop package json does not content dependencies");
    await cleanExit(logger, 1);
  }

  let deps = Object.keys(DesktopPackageJson.dependencies);

  for (const dependencie of deps) {
    const destinationPath = path.join(
      STAGE_THREE_DIST_RESOURCE_NODE_MODULES,
      dependencie,
    );
    logger.info(
      "Copying dependencie ",
      dependencie,
      " Over to ",
      destinationPath,
    );

    try {
      const fromPath = path.join(DESKTOP_NODE_MODULES_PATH, dependencie);

      await fs.access(fromPath);

      await fs.cp(fromPath, destinationPath, { recursive: true });

      logger.info("Copied ", fromPath, " to: ", destinationPath);
    } catch (error) {
      logger.error(
        "Failed to copy ",
        dependencie,
        " to: ",
        destinationPath,
        error,
      );
      await cleanExit(logger, 1);
    }
  }

  logger.info("Renaming electron exe at: ", STAGE_THREE_ELECTRON_EXE_PATH);
  try {
    await fs.access(STAGE_THREE_ELECTRON_EXE_PATH)
    await fs.rename(STAGE_THREE_ELECTRON_EXE_PATH, STAGE_THREE_FLUF_EXE_PATH);
    logger.info("Successfully renamed to fluf.exe");
  } catch (error) {
    logger.error("Failed to rename electron exe path ", error);
    await cleanExit(logger, 1);
  }

  await cleanExit(logger);
}

main();
