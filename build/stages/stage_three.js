import { Logger } from "node-logy";
import { nodeLogyOptions, safeExit, createSafeRunOptions } from "../utils.js";
import { config } from "../config.js";
import { promises } from "node:fs";
import { safeRun } from "node-js-script-utils";

const logger = new Logger(nodeLogyOptions);

async function main() {
  logger.info("Started stage three");

  // Remove previous stage three
  await safeRun(
    async () => {
      await promises.rm(config.stageThree.basePath, {
        force: true,
        recursive: true,
      });
    },
    createSafeRunOptions(
      `Removing previous stage three path at: ${config.stageThree.basePath}`,
      "Previous stage three path removed",
      `Failed to remove previous stage three path at: ${config.stageThree.basePath}`,
      logger,
    ),
  );

  // Check for electron binaries
  await safeRun(
    async () => {
      await promises.access(config.desktop.electronPath);
    },
    createSafeRunOptions(
      `Checking if electron binaries exist at path: ${config.desktop.electronPath}`,
      "Electron binaries verified",
      `Electron binaries do not exist at path: ${config.desktop.electronPath}`,
      logger,
    ),
  );

  // Copy electron binaries to stage three
  await safeRun(
    async () => {
      await promises.mkdir(config.stageThree.basePath, { recursive: true });

      await promises.cp(
        config.desktop.electronPath,
        config.stageThree.basePath,
        { recursive: true },
      );
    },
    createSafeRunOptions(
      `Copying electron from path: ${config.desktop.electronPath} to: ${config.stageThree.basePath}`,
      "Electron binaries copied successfully",
      `Failed to copy electron from path: ${config.desktop.electronPath} to: ${config.stageThree.basePath}`,
      logger,
    ),
  );

  // Remove default app asar
  await safeRun(
    async () => {
      await promises.unlink(config.stageThree.defaultAppAsarPath);
    },
    createSafeRunOptions(
      `Removing default app path: ${config.stageThree.defaultAppAsarPath}`,
      "Default app ASAR removed",
      `Failed to remove default app path: ${config.stageThree.defaultAppAsarPath}`,
      logger,
    ),
  );

  // Move app asar to resource
  await safeRun(
    async () => {
      await promises.copyFile(
        config.stageTwo.asarFilePath,
        config.stageThree.appAsarPath,
      );
    },
    createSafeRunOptions(
      `Copying from: ${config.stageTwo.asarFilePath} to: ${config.stageThree.appAsarPath}`,
      "App ASAR copied to resources",
      `Failed to copy from: ${config.stageTwo.asarFilePath} to: ${config.stageThree.appAsarPath}`,
      logger,
    ),
  );

  // Rename exe path
  await safeRun(
    async () => {
      await promises.rename(
        config.stageThree.defaultExePath,
        config.stageThree.exePath,
      );
    },
    createSafeRunOptions(
      `Renaming default exe from: ${config.stageThree.defaultExePath} to: ${config.stageThree.exePath}`,
      "Executable renamed successfully",
      `Failed to rename default exe from: ${config.stageThree.defaultExePath} to: ${config.stageThree.exePath}`,
      logger,
    ),
  );

  logger.info("Stage three completed successfully");

  // Exit
  await safeExit(logger);
}

main();
