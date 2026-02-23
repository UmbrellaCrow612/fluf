import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uiBasePath = path.join(__dirname, "../", "ui");

const desktopBasePath = path.join(__dirname, "../desktop");

const stageTwoBasePath = path.join(__dirname, "../stage_two");

const stageThreeBasePath = path.join(__dirname, "../stage_three");

/**
 * Contains all config setting values such as path values for each module
 */
export const config = {
  desktop: {
    basePath: desktopBasePath,
    distPath: path.join(desktopBasePath, "dist"),
    packageJsonPath: path.join(desktopBasePath, "package.json"),
    nodeModulesPath: path.join(desktopBasePath, "node_modules"),
    envPath: path.join(desktopBasePath, ".env"),
  },
  ui: {
    basePath: uiBasePath,
    distPath: path.join(uiBasePath, "dist", "ui", "browser"),
  },
  stageOne: {
    basePath: path.join(__dirname, "../stage_one"),
  },
  stageTwo: {
    basePath: stageTwoBasePath,
    asarFilePath: path.join(stageTwoBasePath, "app.asar"),
  },
  stageThree: {
    basePath: stageThreeBasePath,
    resourcePath: path.join(stageThreeBasePath, "resources"),
  },
};
