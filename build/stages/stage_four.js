import { Logger } from "node-logy";
import { nodeLogyOptions, safeExit, safeRun } from "../utils.js";
import { config } from "../config.js";
import fs from "node:fs/promises";
import path from "node:path";

const logger = new Logger(nodeLogyOptions);

async function main() {
  logger.info("Started stage 4");

  // Read package json and get it's deps copy them over
  logger.info(
    `Reading desktop package.json from: ${config.desktop.packageJsonPath}`,
  );
  await safeRun(
    async () => {
      let fileContent = await fs.readFile(config.desktop.packageJsonPath, {
        encoding: "utf-8",
      });
      let asJsonObject = JSON.parse(fileContent);
      if (!asJsonObject?.dependencies) {
        throw new Error(
          "desktop package.json does no have a dependencies field",
        );
      }

      let entries = Object.keys(asJsonObject?.dependencies);

      await fs.access(config.stageThree.resourcePath);

      for (const depName of entries) {
        let depOrginalPath = path.join(config.desktop.nodeModulesPath, depName);
        await fs.access(depOrginalPath);

        let depDestinationPath = path.join(
          config.stageThree.resourcePath,
          "node_modules",
          depName,
        );

        logger.info(
          `Copying from: ${depOrginalPath} to: ${depDestinationPath}`,
        );

        await fs.cp(depOrginalPath, depDestinationPath, { recursive: true });
      }
    },
    logger,
    `Failed to read desktop package.json from: ${config.desktop.packageJsonPath}`,
  );

  // copy over bin to resources
  const binDestinationPath = path.join(config.stageThree.resourcePath, "bin");
  logger.info(
    `Copying over bin from: ${config.desktop.binPath} to: ${binDestinationPath}`,
  );
  await safeRun(
    async () => {
      await fs.access(config.desktop.binPath);

      await fs.cp(config.desktop.binPath, binDestinationPath, {
        recursive: true,
      });
    },
    logger,
    `Failed to copy over bin from: ${config.desktop.binPath} to: ${binDestinationPath}`,
  );

  // copy over env to root
  const envDestPath = path.join(config.stageThree.basePath, ".env");
  logger.info(
    `Copying over .env file from: ${config.desktop.envPath} to: ${envDestPath}`,
  );
  await safeRun(
    async () => {
      await fs.access(config.desktop.envPath);

      await fs.copyFile(config.desktop.envPath, envDestPath);
    },
    logger,
    `Failed to copy over .env file from: ${config.desktop.envPath} to: ${envDestPath}`,
  );

  // Exit
  await safeExit(logger, 0);
}

main();
