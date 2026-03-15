/**
 * Contains code related to chrome extension loading and usage for the application
 */

import { session } from "electron";
import { getEnvValues } from "./env.js";
import { logger } from "./logger.js";

// Angular DevTools extension ID from Chrome Web Store
const ANGULAR_DEVTOOLS_ID = "ienfalfjdbdpebioblfackkekamfmbnh";

/**
 * Contains a list of extensions we load and unload
 */
const extensionIds: string[] = [ANGULAR_DEVTOOLS_ID];

/**
 * Load Chrome extensions in dev mode
 */
export const loadExtensions = async () => {
  logger.info("Loading extensions");
  const env = getEnvValues();

  if (env.MODE !== "dev") {
    return;
  }

  try {
    // Dynamic import for ESM compatibility
    const { installExtension } = await import("electron-devtools-installer");

    for (const extensionId of extensionIds) {
      await installExtension(extensionId, {
        loadExtensionOptions: {
          allowFileAccess: true,
        },
      });

      logger.info(`Extension loaded: ${extensionId}`);
    }

    logger.info("Finished loading extensions ", extensionIds);
  } catch (error) {
    logger.error("Failed to load extensions: ", error);
    // Don't throw - app should work without extensions
  }
};

/**
 * Unload all loaded extensions using Electron's native API
 */
export const unloadExtensions = () => {
  logger.info(`Unloading ${extensionIds.length} extension(s)`);

  const failedExtensionIds: string[] = [];

  for (const extId of extensionIds) {
    try {
      session.defaultSession.extensions.removeExtension(extId);
      logger.info(`Unloaded extension: ${extId}`);
    } catch (error) {
      failedExtensionIds.push(extId);
      logger.warn(`Failed to unload extension ${extId}: `, error);
    }
  }

  if (failedExtensionIds.length > 0) {
    logger.warn("Some extensions failed to unload: ", failedExtensionIds);
  } else {
    logger.info("All extensions unloaded successfully");
  }
};
