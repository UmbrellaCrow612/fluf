/**
 * Contains all the code needed for file-x custom file explorer to work
 */

import { BrowserWindow, type IpcMain } from "electron";
import path from "path";
import { logger } from "./logger.js";
import type {
  CombinedCallback,
  fileXOpen,
  IpcMainInvokeEventCallback,
} from "./type.js";

/**
 * Global ref to file x window used for sending events without being coupled to incoming events
 * @type {import("electron").BrowserWindow | null}
 */
let fileXWindow: BrowserWindow | null = null;

/**
 * Opens a window and load the specific route data for /file-x which is out custom built in file explorer
 */
const createFileXWindow = () => {
  fileXWindow = new BrowserWindow({
    width: 750,
    height: 550,
    minWidth: 450,
    minHeight: 400,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      plugins: true,
    },
  });

  const mode = process.env["MODE"];
  if (!mode) {
    logger.error(".env does not contain .env value MODE");
    throw new Error(".env");
  }

  const devUIPort = process.env["DEV_UI_PORT"];

  if (!devUIPort) {
    logger.error(".env does not contain .env value DEV_UI_PORT");
    throw new Error(".env");
  }

  fileXWindow.on("closed", () => {
    if (fileXWindow?.isDestroyed()) {
      fileXWindow = null;
      logger.info("File x window closed");
    }
  });

  if (mode === "dev") {
    fileXWindow.loadURL(`${devUIPort}#/file-x`);
  } else {
    fileXWindow.loadFile("index.html", { hash: "file-x" });
  }
};

/**
 * Creates a file x window if one is not already created
 *
 * @type {import("./type").CombinedCallback<import("./type").IpcMainInvokeEventCallback, import("./type").fileXOpen>}
 */
const openFileXWindowImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  fileXOpen
> = () => {
  if (fileXWindow && !fileXWindow.isDestroyed()) {
    logger.info("Bringing existing file x window to front");

    if (fileXWindow.isMinimized()) {
      fileXWindow.restore();
    }

    fileXWindow.focus();
    fileXWindow.show();

    return Promise.resolve(false);
  } else {
    logger.info("Opened file x window");
    createFileXWindow();
    return Promise.resolve(true);
  }
};

/**
 * Register all file x related listeners
 * @param {import("electron").IpcMain} ipcMain
 */
export const registerFileXListeners = (ipcMain: IpcMain) => {
  ipcMain.handle("filex:open", openFileXWindowImpl);
};
