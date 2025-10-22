const { contextBridge, ipcRenderer } = require("electron");

/**
 * @type {ElectronApi}
 */
const api = {
  readFile: (_event, filepath) => ipcRenderer.invoke("file:read", filepath),
  createFile: (_event, path) => ipcRenderer.invoke("file:create", path),
  fileExists: (_event, fp) => ipcRenderer.invoke("file:exists", fp),
  deleteFile: (_event, fp) => ipcRenderer.invoke("file:delete", fp),
  readDir: (_event, dirPath) => ipcRenderer.invoke("dir:read", dirPath),
  createDirectory: (_event, fp) => ipcRenderer.invoke("dir:create", fp),
  directoryExists: (_event, fp) => ipcRenderer.invoke("dir:exists", fp),
  deleteDirectory: (_event, dp) => ipcRenderer.invoke("dir:delete", dp),
  selectFolder: (_event) => ipcRenderer.invoke("dir:select"),
  exists: (_event, path) => ipcRenderer.invoke("exists", path),
  isMaximized: (_event) => ipcRenderer.invoke("window:isMaximized"),
  normalize: (_event, path) => ipcRenderer.invoke("path:normalize", path),

  onTerminalChange: (termId, cb) => {
    /**
     * @param {any} _
     * @param {terminalChangeData} data
     */
    let listener = (_, data) => {
      if (data.id == termId) {
        cb(data);
      }
    };

    ipcRenderer.on("terminal-data", listener);

    return () => ipcRenderer.removeListener("terminal-data", listener);
  },

  stopTerminal: (_event, termid) => ipcRenderer.invoke("terminal:stop", termid),

  createTerminal: (_event, directory) =>
    ipcRenderer.invoke("terminal:create", directory),
  killTerminal: (_event, termId) => ipcRenderer.invoke("terminal:kill", termId),
  runCmdsInTerminal: (_event, termId, cmd) =>
    ipcRenderer.invoke("terminal:cmds:run", termId, cmd),
  getTerminalInformation: (_event, termId) =>
    ipcRenderer.invoke("terminal:id", termId),
  restoreTerminals: (_event, terms) =>
    ipcRenderer.invoke("terminal:restore", terms),

  onDirectoryChange: async (dirPath, cb) => {
    await ipcRenderer.invoke("dir:watch", dirPath);

    /**
     * @param {directoryChangedData} data
     */
    const listener = (/** @type {any} */ _, data) => {
      if (data.dirPath === dirPath) cb(data);
    };

    ipcRenderer.on("dir:changed", listener);

    return async () => {
      ipcRenderer.removeListener("dir:changed", listener);
      await ipcRenderer.invoke("dir:unwatch", dirPath);
    };
  },

  minimize: (_event) => ipcRenderer.send("window:minimize"),
  maximize: (_event) => ipcRenderer.send("window:maximize"),
  close: (_event) => ipcRenderer.send("window:close"),
  restore: (_event) => ipcRenderer.send("window:restore"),
};

contextBridge.exposeInMainWorld("electronApi", api);
