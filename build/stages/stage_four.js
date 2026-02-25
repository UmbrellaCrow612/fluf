import { Logger } from "node-logy";
import { nodeLogyOptions, safeExit, createSafeRunOptions } from "../utils.js";
import { config } from "../config.js";
import fs from "node:fs/promises";
import path from "node:path";
import { safeRun } from "node-github-actions";

const logger = new Logger(nodeLogyOptions);

async function main() {
  logger.info("Started stage 4");

  // Read package json and get its deps, copy them over
  await safeRun(
    async () => {
      const fileContent = await fs.readFile(config.desktop.packageJsonPath, {
        encoding: "utf-8",
      });
      const asJsonObject = JSON.parse(fileContent);
      if (!asJsonObject?.dependencies) {
        throw new Error(
          "desktop package.json does not have a dependencies field",
        );
      }

      const entries = Object.keys(asJsonObject.dependencies);

      await fs.access(config.stageThree.resourcePath);

      for (const depName of entries) {
        const depOriginalPath = path.join(
          config.desktop.nodeModulesPath,
          depName,
        );
        await fs.access(depOriginalPath);

        const depDestinationPath = path.join(
          config.stageThree.resourcePath,
          "node_modules",
          depName,
        );

        await fs.cp(depOriginalPath, depDestinationPath, { recursive: true });
      }
    },
    createSafeRunOptions(
      `Reading desktop package.json and copying dependencies from: ${config.desktop.packageJsonPath}`,
      "Dependencies copied successfully",
      `Failed to process desktop package.json from: ${config.desktop.packageJsonPath}`,
      logger,
    ),
  );

  // Copy over bin to resources
  const binDestinationPath = path.join(config.stageThree.resourcePath, "bin");
  await safeRun(
    async () => {
      await fs.access(config.desktop.binPath);

      await fs.cp(config.desktop.binPath, binDestinationPath, {
        recursive: true,
      });
    },
    createSafeRunOptions(
      `Copying over bin from: ${config.desktop.binPath} to: ${binDestinationPath}`,
      "Bin directory copied successfully",
      `Failed to copy over bin from: ${config.desktop.binPath} to: ${binDestinationPath}`,
      logger,
    ),
  );

  // Copy over env to root
  const envDestPath = path.join(config.stageThree.basePath, ".env");
  await safeRun(
    async () => {
      await fs.access(config.desktop.envPath);

      await fs.copyFile(config.desktop.envPath, envDestPath);
    },
    createSafeRunOptions(
      `Copying over .env file from: ${config.desktop.envPath} to: ${envDestPath}`,
      ".env file copied successfully",
      `Failed to copy over .env file from: ${config.desktop.envPath} to: ${envDestPath}`,
      logger,
    ),
  );

  logger.info("Stage 4 completed successfully");

  // Exit
  await safeExit(logger);
}

main();
