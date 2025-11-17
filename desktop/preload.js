const { contextBridge, ipcRenderer } = require("electron");

/**
 * @type {gitApi}
 */
const gitApi = {
  hasGit: (_event) => ipcRenderer.invoke("has:git"),
  isGitInitialized: (_event, dir) => ipcRenderer.invoke("git:is:init", dir),
  initializeGit: (_event, dir) => ipcRenderer.invoke("git:init", dir),

  onGitChange: (callback) => {
    /**
     * Runs when ipc send is sent to `git:change`
     * @param {import("electron").IpcRendererEvent} _event
     * @param {gitStatusResult} data
     */
    let listener = (_event, data) => {
      callback(data);
    };

    ipcRenderer.on("git:change", listener);

    return () => ipcRenderer.removeListener("git:change", listener);
  },

  watchGitRepo: (_event, dir) => ipcRenderer.invoke("git:watch", dir),

  gitStatus: (_event, dir) => ipcRenderer.invoke("git:status", dir),
};

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

  createShell: (_event, dir) => ipcRenderer.invoke("shell:create", dir),
  killShellById: (_event, shellId) => ipcRenderer.invoke("shell:kill", shellId),
  writeToShell: (_event, shellId, cmd) =>
    ipcRenderer.invoke("shell:write", shellId, cmd),
  stopCmdInShell: (_event, shellId) =>
    ipcRenderer.invoke("shell:stop", shellId),

  onShellChange: (shellId, cb) => {
    /**
     * @param {import("electron").IpcRendererEvent} _
     * @param {shellChangeData} data
     */
    let listner = (_, data) => {
      if (data.id == shellId) cb(data);
    };

    ipcRenderer.on("shell:change", listner);

    return () => ipcRenderer.removeListener("shell:change", listner);
  },

  isShellActive: (_event, shellId) =>
    ipcRenderer.invoke("shell:alive", shellId),

  resizeShell: (_, shellId, data) =>
    ipcRenderer.invoke("shell:resize", shellId, data),

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

  ripGrep: (_event, options) => ipcRenderer.invoke("ripgrep:search", options),

  fsearch: (_event, options) => ipcRenderer.invoke("fsearch", options),

  gitApi,
};

contextBridge.exposeInMainWorld("electronApi", api);
