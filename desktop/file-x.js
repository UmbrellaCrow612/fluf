/**
 * Contains all the code needed for file-x custom file explorer to work
 */

const { BrowserWindow } = require("electron");
const path = require("path");
const { logger } = require("./logger");

/**
 * Global ref to file x window used for sending events without being coupled to incoming events
 * @type {import("electron").BrowserWindow | null}
 */
let fileXWindow = null;

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

  const mode = process.env.MODE;
  if (!mode) {
    logger.error(".env does not contain .env value MODE");
    throw new Error(".env");
  }

  const devUIPort = process.env.DEV_UI_PORT;

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
const openFileXWindowImpl = () => {
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
const registerFileXListeners = (ipcMain) => {
  ipcMain.handle("filex:open", openFileXWindowImpl);
};

module.exports = { registerFileXListeners };
