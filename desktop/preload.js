const { contextBridge, ipcRenderer } = require("electron");

/**
 * @type {import("./type").goServer}
 */
const goServer = {
  isReady: () => ipcRenderer.invoke("go:is:ready"),
  start: (wsp) => ipcRenderer.invoke("go:start", wsp),
  stop: () => ipcRenderer.invoke("go:stop"),
  onReady: (callback) => {
    let listener = () => {
      callback();
    };

    ipcRenderer.on("go:ready", listener);

    return () => {
      ipcRenderer.removeListener("go:ready", listener);
    };
  },
  onResponse: (callback) => {
    /**
     * @type {import("./type").CombinedCallback<import("./type").IpcRendererEventCallback, import("./type").goServerOnResponseCallback>}
     */
    let listener = async (_, payload) => {
      await callback(payload);
    };

    ipcRenderer.on("go:message", listener);

    return () => {
      ipcRenderer.removeListener("go:message", listener);
    };
  },

  open: (fp, fc) => ipcRenderer.send("go:open", fp, fc),
  edit: (payload) => ipcRenderer.send("go:edit", payload),
  completion: (...args) => ipcRenderer.send("go:completion", ...args),
};

/**
 * @type {import("./type").urlApi}
 */
const urlApi = {
  fileUriToAbsolutePath: (furl) => ipcRenderer.invoke("uri:to:path", furl),
};

/**
 * @type {import("./type").pythonServer}
 */
const pythonServer = {
  start: (wsf) => ipcRenderer.invoke("python:start", wsf),
  stop: () => ipcRenderer.invoke("python:stop"),
  open: (fp, fc) => ipcRenderer.send("python:file:open", fp, fc),
  edit: (payload) => ipcRenderer.send("python:file:edit", payload),

  onReady: (callback) => {
    /** Runs when event is fired */
    let listener = () => {
      callback();
    };
    ipcRenderer.on("python:ready", listener);

    return () => {
      ipcRenderer.removeListener("python:ready", listener);
    };
  },

  onResponse: (callback) => {
    /**
     * @type {import("./type").CombinedCallback<import("./type").IpcRendererEventCallback, import("./type").pythonServerOnResponseCallback>}
     */
    let listener = async (_, message) => {
      await callback(message);
    };

    ipcRenderer.on("python:message", listener);

    return () => {
      ipcRenderer.removeListener("python:message", listener);
    };
  },
};

/**
 * @type {import("./type").ripgrepApi}
 */
const ripgrepApi = {
  search: (options) => ipcRenderer.invoke("ripgrep:search", options),
};

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
  saveTo: (content, options) =>
    ipcRenderer.invoke("file:save:to", content, options),
  selectFile: () => ipcRenderer.invoke("file:select"),
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
  hasGit: () => ipcRenderer.invoke("has:git"),
  isGitInitialized: (dir) => ipcRenderer.invoke("git:is:init", dir),
  initializeGit: (dir) => ipcRenderer.invoke("git:init", dir),
  gitStatus: (dir) => ipcRenderer.invoke("git:status", dir),
};

/** @type {import("./type").tsServer} */
const tsServer = {
  onResponse: (callback) => {
    /**
     * @type {import("./type").CombinedCallback<import("./type").IpcRendererEventCallback, import("./type").tsServerResponseCallback>}
     */
    let listener = async (_event, message) => {
      await callback(message);
    };

    ipcRenderer.on("tsserver:message", listener);

    return () => ipcRenderer.removeListener("tsserver:message", listener);
  },

  close: (filePath) => ipcRenderer.send("tsserver:file:close", filePath),
  edit: (args) => ipcRenderer.send("tsserver:file:edit", args),
  open: (filePath, content) =>
    ipcRenderer.send("tsserver:file:open", filePath, content),
  completion: (args) => ipcRenderer.send("tsserver:file:completion", args),
  errors: (filePath) => ipcRenderer.send("tsserver:file:error", filePath),
  onReady: (callback) => {
    let listener = () => {
      callback();
    };

    ipcRenderer.on("tsserver:ready", listener);

    return () => {
      ipcRenderer.removeListener("tsserver:ready", listener);
    };
  },
  start: (workSpaceFolder) =>
    ipcRenderer.invoke("tsserver:start", workSpaceFolder),
  stop: () => ipcRenderer.invoke("tsserver:stop"),
};

/**
 * @type {import("./type").fsearchApi}
 */
const fsearchApi = {
  search: (options) => ipcRenderer.invoke("fsearch", options),
};

/**
 * @type {import("./type").clipboardApi}
 */
const clipboardApi = {
  writeImage: (fp) => ipcRenderer.invoke("clipboard:write:image", fp),
};

/**
 * @type {import("./type").ElectronApi}
 */
const api = {
  ripgrepApi,
  fsearchApi,
  gitApi,
  tsServer,
  clipboardApi,
  shellApi,
  pathApi,
  fsApi,
  chromeWindowApi,
  pythonServer,
  urlApi,
  goServer,
};

contextBridge.exposeInMainWorld("electronApi", api);
