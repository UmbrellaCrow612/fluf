import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uiBasePath = path.join(__dirname, "../", "ui");

const desktopBasePath = path.join(__dirname, "../desktop");
const desktopNodeModulesPath = path.join(desktopBasePath, "node_modules");

const stageTwoBasePath = path.join(__dirname, "../stage_two");

const stageThreeBasePath = path.join(__dirname, "../stage_three");
const stageThreeResourcePath =
  process.platform === "darwin"
    ? path.join(
        stageThreeBasePath,
        path.normalize("Electron.app/Contents/Resources"),
      )
    : path.join(stageThreeBasePath, "resources");

const stageThreeDefaultAppAsarPath = path.join(
  stageThreeResourcePath,
  "default_app.asar",
);

const stageThreeFinalBuiltAppAsarPath = path.join(
  stageThreeResourcePath,
  "app.asar",
);

/**
 * Get the path to the default exe of electron used to spawn the app
 * @returns Path to the electron binary that spawns the app
 */
const stageThreeDefaultElectronBinaryPath = () => {
  switch (process.platform) {
    case "win32":
      return path.join(stageThreeBasePath, "electron.exe");

    case "darwin":
      return path.join(
        stageThreeBasePath,
        path.normalize("Electron.app/Contents/MacOS/Electron"),
      );

    case "linux":
      return path.join(stageThreeBasePath, "electron");

    default:
      throw new Error("Unhandled platform");
  }
};

/**
 * Get the path to the new renamed electron exe
 * @returns The new path for the application electron exe renamed
 */
const stageThreeFinalExePath = () => {
  switch (process.platform) {
    case "win32":
      return path.join(stageThreeBasePath, "fluf.exe");

    case "darwin":
      return path.join(
        stageThreeBasePath,
        path.normalize("Electron.app/Contents/MacOS/Fluf"),
      );

    case "linux":
      return path.join(stageThreeBasePath, "fluf");

    default:
      throw new Error("Unhandled platform");
  }
};

/**
 * Contains all config setting values such as path values for each module
 */
export const config = {
  desktop: {
    basePath: desktopBasePath,
    distPath: path.join(desktopBasePath, "dist"),
    packageJsonPath: path.join(desktopBasePath, "package.json"),
    nodeModulesPath: desktopNodeModulesPath,
    envPath: path.join(desktopBasePath, ".env"),
    electronPath: path.join(desktopNodeModulesPath, "electron", "dist"),
    binPath: path.join(desktopBasePath, "bin"),
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
  /**
   * Final folder contains the electron binarys and built application
   */
  stageThree: {
    basePath: stageThreeBasePath,
    resourcePath: stageThreeResourcePath,
    defaultAppAsarPath: stageThreeDefaultAppAsarPath,
    appAsarPath: stageThreeFinalBuiltAppAsarPath,
    defaultExePath: stageThreeDefaultElectronBinaryPath(),
    exePath: stageThreeFinalExePath(),
  },
};
