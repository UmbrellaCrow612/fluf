import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uiBasePath = path.join(__dirname, "../", "ui");

const desktopBasePath = path.join(__dirname, "../desktop")

/**
 * Contains all config setting values such as path values for each module
 */
export const config = {
  desktop: {
    basePath: desktopBasePath,
    distPath: path.join(desktopBasePath, "dist")
  },
  ui: {
    basePath: uiBasePath,
    distPath: path.join(uiBasePath, "dist"),
  },
};
