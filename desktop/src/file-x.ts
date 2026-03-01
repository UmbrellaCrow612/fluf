/**
 * Contains all the code needed for file-x custom file explorer to work
 */

import { BrowserWindow } from "electron";
import * as path from "node:path";
import { logger } from "./logger.js";
import type {
  CombinedCallback,
  fileXOpen,
  IpcMainInvokeEventCallback,
} from "./type.js";
import { fileURLToPath } from "url";
import type { TypedIpcMain } from "./typed-ipc.js";
import { getEnvValues } from "./env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Global ref to file x window used for sending events without being coupled to incoming events
 */
let fileXWindow: BrowserWindow | null = null;

/**
 * Opens a window and load the specific route data for /file-x which is out custom built in file explorer
 */
const createFileXWindow = async () => {
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

  let envValues = getEnvValues();

  fileXWindow.on("closed", () => {
    if (fileXWindow?.isDestroyed()) {
      fileXWindow = null;
      logger.info("File x window closed");
    }
  });

  if (envValues.MODE === "dev") {
    await fileXWindow.loadURL(`${envValues.DEV_UI_PORT}#/file-x`);
  } else {
    await fileXWindow.loadFile("index.html", { hash: "file-x" });
  }
};

/**
 * Creates a file x window if one is not already created
 */
const openFileXWindowImpl: CombinedCallback<
  IpcMainInvokeEventCallback,
  fileXOpen
> = async () => {
  try {
    if (fileXWindow && !fileXWindow.isDestroyed()) {
      logger.info("Bringing existing file x window to front");

      if (fileXWindow.isMinimized()) {
        fileXWindow.restore();
      }

      fileXWindow.focus();
      fileXWindow.show();

      return true;
    } else {
      logger.info("Opened file x window");
      await createFileXWindow();
      return true;
    }
  } catch (error) {
    logger.error("Failed to open or bring window to front: ", error);
    return false;
  }
};

/**
 * Contains all file x event operations
 */
export interface FileXEvents {
  "filex:open": {
    args: [];
    return: boolean;
  };
}

/**
 * Register all file x related listeners
 */
export const registerFileXListeners = (typedIpcMain: TypedIpcMain) => {
  typedIpcMain.handle("filex:open", openFileXWindowImpl);
};
