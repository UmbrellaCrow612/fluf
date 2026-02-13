import { loadEnvFile } from "node:process";
import { registerProtocols } from "./protocol.js";
import path from "node:path";
import { app, BrowserWindow, ipcMain, protocol } from "electron";
import { logger } from "./logger.js";
import {
  startCommandServer,
  stopCommandServer,
} from "./command-server/server.js";
import { registerRipgrepListeners } from "./ripgrep.js";
import { registerGitListeners } from "./git.js";
import { registerFsearchListeners } from "./fsearch.js";
import { registerClipboardListeners } from "./clipboard.js";
import { registerPdfListeners } from "./pdf.js";
import { registerImageListeners } from "./image.js";
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadEnvFile(".env");
registerProtocols();

/**
 * Renders the default route for both dev and in prod - points either to the URL or index.html file which should render the editor itself
 */
const createWindow = () => {
  let preloadPath = path.join(__dirname, "preload.js");

  logger.warn(preloadPath);

  const window = new BrowserWindow({
    width: 800,
    minWidth: 800,
    height: 600,
    minHeight: 600,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      plugins: true,
    },
  });

  let mode = process.env["MODE"];
  if (!mode) {
    logger.error(".env does not contain .env value MODE");
    throw new Error(".env");
  }

  let devUIPort = process.env["DEV_UI_PORT"];
  if (!devUIPort) {
    logger.error(".env does not contain .env value DEV_UI_PORT");
    throw new Error(".env");
  }

  if (mode === "dev") {
    // In dev we can just load the running app on the website port it is running on instead of loading it from file system works the same
    logger.info(
      "Running dev mode loading website from " + process.env["DEV_UI_PORT"],
    );

    window.loadURL(devUIPort);
  } else {
    logger.info("Running application from build index.html");
    window.loadFile("index.html");
  }
};

app.whenReady().then(async () => {
  createWindow();
  await startCommandServer();

  registerRipgrepListeners(ipcMain);
  registerGitListeners(ipcMain);
  registerFsearchListeners(ipcMain);
  registerClipboardListeners(ipcMain);
  registerPdfListeners(protocol);
  registerImageListeners(protocol);
  registerShellListeners(ipcMain);
  registerFsListeners(ipcMain);
  registerWindowListener(ipcMain);
  registerPathListeners(ipcMain);
  registerFileXListeners(ipcMain);
  registerLanguageServerListener(ipcMain);
  registerStoreListeners(ipcMain);
});

app.on("before-quit", async () => {
  await stopCommandServer();

  await stopAllLanguageServers();
  cleanUpWatchers();
  cleanUpShells();

  await logger.flush();
  await logger.shutdown();
});
