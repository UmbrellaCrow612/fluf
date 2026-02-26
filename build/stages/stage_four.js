import { Logger } from "node-logy";
import { promises as fs } from "node:fs";
import path from "node:path";
import { nodeLogyOptions, safeExit } from "../utils.js";
import { config } from "../config.js";

import { safeRun } from "node-github-actions";

const logger = new Logger(nodeLogyOptions);

safeRun(
  async () => {
    // Read package.json and copy dependencies
    logger.info(
      `Reading desktop package.json at: ${config.desktop.packageJsonPath}`,
    );
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

    logger.info(
      `Verifying stage three resources exist at: ${config.stageThree.resourcePath}`,
    );
    await fs.access(config.stageThree.resourcePath);
    logger.info("Stage three resources verified");

    for (const depName of entries) {
      const depOriginalPath = path.join(
        config.desktop.nodeModulesPath,
        depName,
      );
      logger.info(`Verifying dependency exists at: ${depOriginalPath}`);
      await fs.access(depOriginalPath);
      logger.info("Dependency verified");

      const depDestinationPath = path.join(
        config.stageThree.resourcePath,
        "node_modules",
        depName,
      );

      logger.info(
        `Copying dependency from: ${depOriginalPath} to: ${depDestinationPath}`,
      );
      await fs.cp(depOriginalPath, depDestinationPath, { recursive: true });
      logger.info("Dependency copied successfully");
    }
    logger.info("All dependencies copied successfully");

    // Copy bin to resources
    const binDestinationPath = path.join(config.stageThree.resourcePath, "bin");
    logger.info(`Verifying bin directory exists at: ${config.desktop.binPath}`);
    await fs.access(config.desktop.binPath);
    logger.info("Bin directory verified");

    logger.info(
      `Copying bin directory from: ${config.desktop.binPath} to: ${binDestinationPath}`,
    );
    await fs.cp(config.desktop.binPath, binDestinationPath, {
      recursive: true,
    });
    logger.info("Bin directory copied successfully");

    // Copy .env to root
    const envDestPath = path.join(config.stageThree.basePath, ".env");
    logger.info(`Verifying .env file exists at: ${config.desktop.envPath}`);
    await fs.access(config.desktop.envPath);
    logger.info(".env file verified");

    logger.info(
      `Copying .env file from: ${config.desktop.envPath} to: ${envDestPath}`,
    );
    await fs.copyFile(config.desktop.envPath, envDestPath);
    logger.info(".env file copied successfully");

    logger.info("Stage four completed successfully");
  },
  {
    exitFailCode: 1,
    exitOnFailed: true,
    onBefore: () => {
      logger.info("Started stage four");
    },
    onAfter: async () => {
      await safeExit(logger);
    },
    onFail: async (err) => {
      logger.error("Stage four failed ", err);
      await safeExit(logger);
    },
    timeoutMs: 3 * 60 * 1000,
  },
);
