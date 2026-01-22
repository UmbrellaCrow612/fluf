const { contextBridge, ipcRenderer } = require("electron");

/**
 * @type {import("./type").ILanguageServerClient}
 */
const lspClient = {
  start: (...args) => ipcRenderer.invoke("lsp:start", ...args),
  stop: (...args) => ipcRenderer.invoke("lsp:stop", ...args),
  isRunning: (...args) => ipcRenderer.invoke("lsp:is:running", ...args),

  onData: (callback) => {
    /**
     * @param {*} _
     * @param {*} object
     */
    let l = (_, object) => {
      callback(object);
    };

    ipcRenderer.on("lsp:data", l);

    return () => {
      ipcRenderer.removeListener("lsp:data", l);
    };
  },

  onNotifications: (callback) => {
    /**
     * @param {*} _
     * @param {*} data
     */
    let l = (_, data) => {
      callback(data);
    };

    ipcRenderer.on("lsp:notification", l);

    return () => {
      ipcRenderer.removeListener("lsp:on:notification", l);
    };
  },

  onNotification: (method, callback) => {
    /**
     * @param {*} _
     * @param {*} data
     */
    let l = (_, data) => {
      callback(data);
    };

    ipcRenderer.on(`lsp:notification:${method}`, l);

    return () => {
      ipcRenderer.removeListener(`lsp:notification:${method}`, l);
    };
  },

  onReady: (callback) => {
    /**
     * @type {import("./type").CombinedCallback<import("./type").IpcRendererEventCallback, import("./type").ILanguageServerClientOnReadyCallback>}
     */
    const list = (_, languageId, workSpaceFolder) => {
      callback(languageId, workSpaceFolder);
    };

    ipcRenderer.on("lsp:on:ready", list);

    return () => {
      ipcRenderer.removeListener("lsp:on:ready", list);
    };
  },

  didChangeTextDocument: (...args) =>
    ipcRenderer.send("lsp:document:change", ...args),
  didOpenTextDocument: (...args) =>
    ipcRenderer.send("lsp:document:open", ...args),
  didCloseTextDocument: (...args) =>
    ipcRenderer.send("lsp:document:close", ...args),

  hover: (...args) => ipcRenderer.invoke("lsp:document:hover", ...args),
  completion: (...args) =>
    ipcRenderer.invoke("lsp:document:completion", ...args),
  definition: (...args) =>
    ipcRenderer.invoke("lsp:document:definition", ...args),
};

/**
 * @type {import("./type").urlApi}
 */
const urlApi = {
  fileUriToAbsolutePath: (...args) =>
    ipcRenderer.invoke("uri:to:path", ...args),
};

/**
 * @type {import("./type").ripgrepApi}
 */
const ripgrepApi = {
  search: (...args) => ipcRenderer.invoke("ripgrep:search", ...args),
};

/**
 * @type {import("./type").chromeWindowApi}
 */
const chromeWindowApi = {
  isMaximized: (...args) => ipcRenderer.invoke("window:ismaximized", ...args),
  minimize: (...args) => ipcRenderer.send("window:minimize", ...args),
  maximize: (...args) => ipcRenderer.send("window:maximize", ...args),
  close: (...args) => ipcRenderer.send("window:close", ...args),
  restore: (...args) => ipcRenderer.send("window:restore", ...args),
};

/**
 * @type {import("./type").fsApi}
 */
const fsApi = {
  readFile: (...args) => ipcRenderer.invoke("file:read", ...args),
  write: (...args) => ipcRenderer.invoke("file:write", ...args),
  createFile: (...args) => ipcRenderer.invoke("file:create", ...args),
  exists: (...args) => ipcRenderer.invoke("fs:exists", ...args),
  remove: (...args) => ipcRenderer.invoke("fs:remove", ...args),
  readDir: (...args) => ipcRenderer.invoke("dir:read", ...args),
  createDirectory: (...args) => ipcRenderer.invoke("dir:create", ...args),
  selectFolder: (...args) => ipcRenderer.invoke("dir:select", ...args),

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

  stopWatching: (...args) => ipcRenderer.send("fs:unwatch", ...args),
  saveTo: (...args) => ipcRenderer.invoke("file:save:to", ...args),
  selectFile: (...args) => ipcRenderer.invoke("file:select", ...args),
};

/**
 * @type {import("./type").pathApi}
 */
const pathApi = {
  normalize: (...args) => ipcRenderer.invoke("path:normalize", ...args),
  relative: (...args) => ipcRenderer.invoke("path:relative", ...args),
  sep: (...args) => ipcRenderer.invoke("path:sep", ...args),
  join: (...args) => ipcRenderer.invoke("path:join", ...args),
  isAbsolute: (...args) => ipcRenderer.invoke("path:isabsolute", ...args),
};

/** @type {import("./type").shellApi} */
const shellApi = {
  create: (...args) => ipcRenderer.invoke("shell:create", ...args),
  kill: (...args) => ipcRenderer.invoke("shell:kill", ...args),
  resize: (...args) => ipcRenderer.invoke("shell:resize", ...args),
  write: (...args) => {
    ipcRenderer.send("shell:write", ...args);
  },
  onChange: (pid, callback) => {
    /**
     * @param {import("electron").IpcRendererEvent} _
     * @param  {number} id
     * @param {string} chunk
     */
    let listener = (_, id, chunk) => {
      if (pid == id) callback(chunk);
    };

    ipcRenderer.on(`shell:change`, listener);

    return () => ipcRenderer.removeListener("shell:change", listener);
  },

  onExit: (pid, callback) => {
    /**
     * @param {import("electron").IpcRendererEvent} _
     * @param  {number} id
     */
    let listener = (_, id) => {
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
  hasGit: (...args) => ipcRenderer.invoke("has:git", ...args),
  isGitInitialized: (...args) => ipcRenderer.invoke("git:is:init", ...args),
  initializeGit: (...args) => ipcRenderer.invoke("git:init", ...args),
  gitStatus: (...args) => ipcRenderer.invoke("git:status", ...args),
};

/**
 * @type {import("./type").fsearchApi}
 */
const fsearchApi = {
  search: (...args) => ipcRenderer.invoke("fsearch", ...args),
};

/**
 * @type {import("./type").clipboardApi}
 */
const clipboardApi = {
  writeImage: (...args) => ipcRenderer.invoke("clipboard:write:image", ...args),
};

/**
 * @type {import("./type").ElectronApi}
 */
const api = {
  ripgrepApi,
  fsearchApi,
  gitApi,
  clipboardApi,
  shellApi,
  pathApi,
  fsApi,
  chromeWindowApi,
  urlApi,
  lspClient,
};

contextBridge.exposeInMainWorld("electronApi", api);
