/*
 * Contains all code related to the chrome window itself not the js window object
 */

const { BrowserWindow } = require("electron");

/**
 * Register custom listener for chrome window itself
 * @param {import("electron").IpcMain} ipcMain
 */
const registerWindowListener = (ipcMain) => {
  ipcMain.handle("window:ismaximized", (event) => {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents);
    return win?.isMaximized();
  });

  ipcMain.on("window:minimize", (event) => {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents);

    win?.minimize();
  });

  ipcMain.on("window:maximize", (event) => {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents);

    win?.maximize();
  });

  ipcMain.on("window:close", (event) => {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents);

    win?.close();
  });

  ipcMain.on("window:restore", (event) => {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents);

    win?.restore();
  });
};

module.exports = { registerWindowListener };
