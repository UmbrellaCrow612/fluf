/*
 * Contains all code related to the chrome window itself not the js window object
 */

import { BrowserWindow } from "electron";
import type { TypedIpcMain } from "./typed-ipc.js";

/**
 * Event map for window operations
 */
export interface WindowEvents {
  "window:is:maximized": {
    args: [];
    return: boolean;
  };

  "window:minimize": {
    args: [];
    return: void;
  };

  "window:maximize": {
    args: [];
    return: void;
  };

  "window:close": {
    args: [];
    return: void;
  };

  "window:restore": {
    args: [];
    return: void;
  };
}

/**
 * Register custom listener for chrome window itself
 */
export const registerWindowListener = (typedIpcMain: TypedIpcMain) => {
  typedIpcMain.handle("window:is:maximized", (event) => {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents);
    if (!win || win.isDestroyed()) {
      return false;
    }

    return win.isMaximized();
  });

  typedIpcMain.on("window:minimize", (event) => {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents);
    if (!win || win.isDestroyed()) {
      return;
    }

    win.minimize();
  });

  typedIpcMain.on("window:maximize", (event) => {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents);
    if (!win || win.isDestroyed()) {
      return;
    }

    win.maximize();
  });

  typedIpcMain.on("window:close", (event) => {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents);
    if (!win || win.isDestroyed()) {
      return;
    }

    win.close();
  });

  typedIpcMain.on("window:restore", (event) => {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents);
    if (!win || win.isDestroyed()) {
      return;
    }

    win.restore();
  });
};
