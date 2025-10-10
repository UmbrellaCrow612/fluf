const { contextBridge, ipcRenderer } = require("electron");

/**
 * @type {ElectronApi}
 */
const api = {
  readFile: (_event, filepath) => ipcRenderer.invoke("file:read", filepath),
  readDir: (_event, dirPath, options) =>
    ipcRenderer.invoke("dir:read", dirPath, options),
  selectFolder: (_event) => ipcRenderer.invoke("dir:select"),
  exists: (_event, path) => ipcRenderer.invoke("exists"),
};

contextBridge.exposeInMainWorld("electronApi", api);
