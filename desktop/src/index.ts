import { loadEnvFile } from "node:process";
import path from "node:path";
import { app, BrowserWindow, ipcMain } from "electron";
import { logger } from "./logger.js";
import {
  startCommandServer,
  stopCommandServer,
} from "./command-server/server.js";
import { registerRipgrepListeners } from "./ripgrep.js";
import { registerGitListeners } from "./git.js";
import { registerFsearchListeners } from "./fsearch.js";
import { registerClipboardListeners } from "./clipboard.js";
import { cleanUpShells, registerShellListeners } from "./shell.js";
import { cleanUpWatchers, registerFsListeners } from "./fs.js";
import { registerWindowListener } from "./window.js";
import { registerPathListeners } from "./path.js";
import { registerFileXListeners } from "./file-x.js";
import {
  registerLanguageServerListener,
  stopAllLanguageServers,
} from "./lsp/bridge.js";
import { registerStoreListeners } from "./store.js";
import { fileURLToPath } from "node:url";
import { getEnvValues, validateEnv } from "./env.js";
import { loadExtensions, unloadExtensions } from "./chrome-extensions.js";
import {
  registerSystemFileListeners,
  registerSystemFileProtocol,
} from "./system-files-protocol.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadEnvFile(".env");
validateEnv();
registerSystemFileProtocol();

/**
 * Renders the default route for both dev and in prod - points either to the URL or index.html file which should render the editor itself
 */
const createWindow = () => {
  let enValues = getEnvValues();

  const window = new BrowserWindow({
    width: 800,
    minWidth: 800,
    height: 600,
    minHeight: 600,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      plugins: true,
      sandbox: enValues.MODE !== "dev",
    },
  });

  if (enValues.MODE === "dev") {
    // In dev we can just load the running app on the website port it is running on instead of loading it from file system works the same
    logger.info("Running dev mode loading website from ", enValues.DEV_UI_PORT);

    window.loadURL(enValues.DEV_UI_PORT);
  } else {
    logger.info("Running application from build index.html");
    window.loadFile("index.html");
  }
};

app.whenReady().then(async () => {
  await loadExtensions();

  createWindow();
  await startCommandServer();

  registerRipgrepListeners(ipcMain);
  registerGitListeners(ipcMain);
  registerFsearchListeners(ipcMain);
  registerClipboardListeners(ipcMain);
  registerShellListeners(ipcMain);
  registerFsListeners(ipcMain);
  registerWindowListener(ipcMain);
  registerPathListeners(ipcMain);
  registerFileXListeners(ipcMain);
  registerLanguageServerListener(ipcMain);
  registerStoreListeners(ipcMain);

  registerSystemFileListeners();
});

const appCleanUp = async () => {
  unloadExtensions();

  await stopCommandServer();

  await stopAllLanguageServers();
  cleanUpWatchers();
  cleanUpShells();

  await logger.flush();
  await logger.shutdown();
};

app.on("before-quit", async () => {
  await appCleanUp();
});

process.on("SIGINT", async () => {
  console.log("Caught SIGINT (Ctrl+C)");
  await appCleanUp();
});

process.on("SIGTERM", async () => {
  console.log("Caught SIGTERM");
  await appCleanUp();
});
