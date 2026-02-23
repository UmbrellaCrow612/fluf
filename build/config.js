import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uiBasePath = path.join(__dirname, "../", "ui");

/**
 * Contains all config setting values such as path values for each module
 */
export const config = {
  desktop: {
    basePath: path.join(__dirname),
  },
  ui: {
    basePath: uiBasePath,
    distPath: path.join(uiBasePath, "dist"),
  },
};
