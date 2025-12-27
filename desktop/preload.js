const { contextBridge, ipcRenderer } = require("electron");

/**
 * @type {import("./type").chromeWindowApi}
 */
const chromeWindowApi = {
  isMaximized: () => ipcRenderer.invoke("window:ismaximized"),
  minimize: () => ipcRenderer.send("window:minimize"),
  maximize: () => ipcRenderer.send("window:maximize"),
  close: () => ipcRenderer.send("window:close"),
  restore: () => ipcRenderer.send("window:restore"),
};

/**
 * @type {import("./type").fsApi}
 */
const fsApi = {
  readFile: (fp) => ipcRenderer.invoke("file:read", fp),
  write: (fp, c) => ipcRenderer.invoke("file:write", fp, c),
  createFile: (fp) => ipcRenderer.invoke("file:create", fp),
  exists: (path) => ipcRenderer.invoke("fs:exists", path),
  remove: (path) => ipcRenderer.invoke("fs:remove", path),
  readDir: (path) => ipcRenderer.invoke("dir:read", path),
  createDirectory: (p) => ipcRenderer.invoke("dir:create", p),
  selectFolder: () => ipcRenderer.invoke("dir:select"),

  onChange: (path, callback) => {
    /**
     * @param {import("electron").IpcRendererEvent} _
     * @param {string} changedPath - The dir changed
     * @param {import("fs/promises").FileChangeInfo<string>} event
     */
    let listener = (_, changedPath, event) => {
      if (path === changedPath) {
        callback(event);
      }
    };

    ipcRenderer.on("fs:change", listener);

    ipcRenderer.send("fs:watch", path);

    return () => {
      ipcRenderer.removeListener("fs:change", listener);
    };
  },

  stopWatching: (path) => ipcRenderer.send("fs:unwatch", path),
};

/**
 * @type {import("./type").pathApi}
 */
const pathApi = {
  normalize: (fp) => ipcRenderer.invoke("path:normalize", fp),
  relative: (f, t) => ipcRenderer.invoke("path:relative", f, t),
  sep: () => ipcRenderer.invoke("path:sep"),
  join: (...args) => ipcRenderer.invoke("path:join", ...args),
  isAbsolute: (p) => ipcRenderer.invoke("path:isabsolute", p),
};

/** @type {import("./type").shellApi} */
const shellApi = {
  create: (dir) => ipcRenderer.invoke("shell:create", dir),
  kill: (pid) => ipcRenderer.invoke("shell:kill", pid),
  resize: (pid, col, row) => ipcRenderer.invoke("shell:resize", pid, col, row),
  write: (pid, chunk) => {
    ipcRenderer.send("shell:write", pid, chunk);
  },
  onChange: (pid, callback) => {
    /**
     * @param {import("electron").IpcRendererEvent} event
     * @param  {number} id
     * @param {string} chunk
     */
    let listener = (event, id, chunk) => {
      if (pid == id) callback(chunk);
    };

    ipcRenderer.on(`shell:change`, listener);

    return () => ipcRenderer.removeListener("shell:change", listener);
  },

  onExit: (pid, callback) => {
    /**
     * @param {import("electron").IpcRendererEvent} event
     * @param  {number} id
     */
    let listener = (event, id) => {
      if (pid === id) callback();
    };

    ipcRenderer.on("shell:exit", listener);

    return () => ipcRenderer.removeListener("shell:exit", listener);
  },
};

/**
 * @type {import("./type").gitApi}
 */
const gitApi = {
  hasGit: () => ipcRenderer.invoke("has:git"),
  isGitInitialized: (dir) => ipcRenderer.invoke("git:is:init", dir),
  initializeGit: (dir) => ipcRenderer.invoke("git:init", dir),
  gitStatus: (dir) => ipcRenderer.invoke("git:status", dir),
};

/** @type {import("./type").tsServer} */
const tsServer = {
  onResponse: (callback) => {
    /**
     * Custom listner to register and unsub
     * @param {import("electron").IpcRendererEvent} _event
     * @param {import("./type").tsServerOutput} message
     */
    let listener = (_event, message) => {
      callback(message);
    };

    ipcRenderer.on("tsserver:message", listener);

    return () => ipcRenderer.removeListener("tsserver:message", listener);
  },

  closeFile: (filePath) => ipcRenderer.send("tsserver:file:close", filePath),
  editFile: (args) => ipcRenderer.send("tsserver:file:edit", args),
  openFile: (filePath, content) =>
    ipcRenderer.send("tsserver:file:open", filePath, content),
  completion: (args) => ipcRenderer.send("tsserver:file:completion", args),

  errors: (filePath) => ipcRenderer.send("tsserver:file:error", filePath),
};

/**
 * @type {import("./type").ElectronApi}
 */
const api = {
  ripGrep: (_event, options) => ipcRenderer.invoke("ripgrep:search", options),

  fsearch: (_event, options) => ipcRenderer.invoke("fsearch", options),

  gitApi,
  tsServer,

  writeImageToClipboard: (_event, fp) =>
    ipcRenderer.invoke("clipboard:write:image", fp),

  shellApi,
  pathApi,
  fsApi,
  chromeWindowApi,
};

contextBridge.exposeInMainWorld("electronApi", api);
