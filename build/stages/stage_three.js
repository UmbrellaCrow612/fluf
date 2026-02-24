import { Logger } from "node-logy";
import { nodeLogyOptions, safeExit, safeRun } from "../utils.js";
import { config } from "../config.js";
import { promises } from "node:fs";

const logger = new Logger(nodeLogyOptions);

async function main() {
  logger.info("Started stage three");

  // remove previous stage three
  logger.info(
    `Removing previous stage three path at: ${config.stageThree.basePath}`,
  );
  await safeRun(
    async () => {
      await promises.rm(config.stageThree.basePath, {
        force: true,
        recursive: true,
      });
    },
    logger,
    `Failed to remove previous stage three path at: ${config.stageThree.basePath}`,
  );

  // Check for electron binarys
  logger.info(
    `Checking if electron binarys exist at path: ${config.desktop.electronPath}`,
  );
  await safeRun(
    async () => {
      await promises.access(config.desktop.electronPath);
    },
    logger,
    `Failed to check if electron binarys exist at path: ${config.desktop.electronPath}`,
  );

  // Copy electron binarys to stage three
  logger.info(
    `Copying electron from path: ${config.desktop.electronPath} to: ${config.stageThree.basePath}`,
  );
  await safeRun(
    async () => {
      await promises.mkdir(config.stageThree.basePath, { recursive: true });

      await promises.cp(
        config.desktop.electronPath,
        config.stageThree.basePath,
        { recursive: true },
      );
    },
    logger,
    `Failed to copy electron from path: ${config.desktop.electronPath} to: ${config.stageThree.basePath}`,
  );

  // remove default app asar
  logger.info(
    `Removing default app path: ${config.stageThree.defaultAppAsarPath}`,
  );
  await safeRun(
    async () => {
      await promises.unlink(config.stageThree.defaultAppAsarPath);
    },
    logger,
    `Failed to remove default app path: ${config.stageThree.defaultAppAsarPath}`,
  );

  // move app asar to resource
  logger.info(
    `Copying from: ${config.stageTwo.asarFilePath} to: ${config.stageThree.appAsarPath}`,
  );
  await safeRun(
    async () => {
      await promises.copyFile(
        config.stageTwo.asarFilePath,
        config.stageThree.appAsarPath,
      );
    },
    logger,
    `Failed to copy from: ${config.stageTwo.asarFilePath} to: ${config.stageThree.appAsarPath}`,
  );

  // rename exe path
  logger.info(
    `Renaming default exe from: ${config.stageThree.defaultExePath} to: ${config.stageThree.exePath}`,
  );
  await safeRun(
    async () => {
      await promises.rename(
        config.stageThree.defaultExePath,
        config.stageThree.exePath,
      );
    },
    logger,
    `Failed to rename default exe from: ${config.stageThree.defaultExePath} to: ${config.stageThree.exePath}`,
  );

  // Exit
  await safeExit(logger, 0);
}

main();
