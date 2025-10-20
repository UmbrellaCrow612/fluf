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

  onTerminalChange: (cb) => {
    /** @type {onTerminalChangeListner} */
    let listener = (_, data) => {
      cb(data);
    };

    ipcRenderer.on("terminal-data", listener);

    return () => ipcRenderer.removeListener("terminal-data", listener);
  },

  createTerminal: (_event, directory) =>
    ipcRenderer.invoke("terminal:create", directory),
  killTerminal: (_event, termId) => ipcRenderer.invoke("terminal:kill", termId),
  runCmdsInTerminal: (_event, termId, cmd) =>
    ipcRenderer.invoke("terminal:cmds:run", termId, cmd),

  minimize: (_event) => ipcRenderer.send("window:minimize"),
  maximize: (_event) => ipcRenderer.send("window:maximize"),
  close: (_event) => ipcRenderer.send("window:close"),
  restore: (_event) => ipcRenderer.send("window:restore"),
};

contextBridge.exposeInMainWorld("electronApi", api);
