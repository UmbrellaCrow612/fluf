/**
 * Preload script that is loaded in the browser / attached to the window object to access the api's defined.
 *
 * SHOULD NOT USE ANY OTHER TS/JS MODULE CODE OR ANY BUILT IN NODE MODULES DRECTLY HERE AS THEY WILL FAIL
 * TO LOAD IN THE BROWSER.
 */

import type {
  chromeWindowApi,
  clipboardApi,
  CombinedCallback,
  commandServer,
  ElectronApi,
  fileXApi,
  fsApi,
  fsearchApi,
  gitApi,
  ILanguageServerClient,
  IpcRendererEventCallback,
  onFsChangeCallback,
  onShellExitCallback,
  pathApi,
  ripgrepApi,
  shellApi,
  shellChangeCallback,
  storeApi,
  storeChangeCallback,
} from "./type.js";

import { contextBridge, ipcRenderer } from "electron";
import type { TypedIpcRenderer } from "./typed-ipc.js";

/**
 * Fully typed version of ipc render
 */
const typedIpcRender = ipcRenderer as TypedIpcRenderer;

const commandServer: commandServer = {
  onOpenFile: (callback) => {
    const l = async (_: any, req: any) => {
      await callback(req);
    };

    ipcRenderer.on("command:open:file", l);

    return () => {
      ipcRenderer.removeListener("command:open:file", l);
    };
  },
};

const fileXApi: fileXApi = {
  open: (...args) => typedIpcRender.invoke("filex:open", ...args),
};

const lspClient: ILanguageServerClient = {
  start: (...args) => ipcRenderer.invoke("lsp:start", ...args),
  stop: (...args) => ipcRenderer.invoke("lsp:stop", ...args),
  isRunning: (...args) => ipcRenderer.invoke("lsp:is:running", ...args),

  onData: (callback) => {
    /**
     * @param {*} _
     * @param {*} object
     */
    const l = (_: any, object: any) => {
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
    const l = (_: any, data: any) => {
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
    const l = (_: any, data: any) => {
      callback(data);
    };

    ipcRenderer.on(`lsp:notification:${method}`, l);

    return () => {
      ipcRenderer.removeListener(`lsp:notification:${method}`, l);
    };
  },

  onReady: (callback) => {
    /**
     * @type {import("./type.js").CombinedCallback<import("./type.js").IpcRendererEventCallback, import("./type.js").ILanguageServerClientOnReadyCallback>}
     */
    const list = (_: any, languageId: any, workSpaceFolder: any) => {
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

const ripgrepApi: ripgrepApi = {
  search: (...args) => typedIpcRender.invoke("ripgrep:search", ...args),
};

const chromeWindowApi: chromeWindowApi = {
  isMaximized: (...args) =>
    typedIpcRender.invoke("window:is:maximized", ...args),
  minimize: (...args) => typedIpcRender.send("window:minimize", ...args),
  maximize: (...args) => typedIpcRender.send("window:maximize", ...args),
  close: (...args) => typedIpcRender.send("window:close", ...args),
  restore: (...args) => typedIpcRender.send("window:restore", ...args),
};

const fsApi: fsApi = {
  readFile: (...args) => typedIpcRender.invoke("file:read", ...args),
  write: (...args) => typedIpcRender.invoke("file:write", ...args),
  createFile: (...args) => typedIpcRender.invoke("file:create", ...args),
  exists: (...args) => typedIpcRender.invoke("fs:exists", ...args),
  remove: (...args) => typedIpcRender.invoke("fs:remove", ...args),
  readDir: (...args) => typedIpcRender.invoke("dir:read", ...args),
  createDirectory: (...args) => typedIpcRender.invoke("dir:create", ...args),
  selectFolder: (...args) => typedIpcRender.invoke("dir:select", ...args),
  getNode: (...args) => typedIpcRender.invoke("fs:path:as:node", ...args),
  fuzzyFindDirectorys: (...args) =>
    typedIpcRender.invoke("dir:fuzzy:find", ...args),
  countItemsInDirectory: (...args) =>
    typedIpcRender.invoke("dir:items:count", ...args),

  onChange: (path, callback) => {
    const listener: CombinedCallback<
      IpcRendererEventCallback,
      onFsChangeCallback
    > = (_, pathLike, event) => {
      if (pathLike === path) {
        callback(path, event);
      }
    };

    typedIpcRender.on("fs:change", listener);

    typedIpcRender.send("fs:watch", path);

    return () => {
      typedIpcRender.removeListener("fs:change", listener);
    };
  },

  stopWatching: (...args) => typedIpcRender.send("fs:unwatch", ...args),
  saveTo: (...args) => typedIpcRender.invoke("file:save:to", ...args),
  selectFile: (...args) => typedIpcRender.invoke("file:select", ...args),
};

const pathApi: pathApi = {
  normalize: (...args) => typedIpcRender.invoke("path:normalize", ...args),
  relative: (...args) => typedIpcRender.invoke("path:relative", ...args),
  sep: (...args) => typedIpcRender.invoke("path:sep", ...args),
  join: (...args) => typedIpcRender.invoke("path:join", ...args),
  isAbsolute: (...args) => typedIpcRender.invoke("path:is:absolute", ...args),
  getRootPath: (...args) => typedIpcRender.invoke("path:root", ...args),
};

const shellApi: shellApi = {
  create: (...args) => typedIpcRender.invoke("shell:create", ...args),
  kill: (...args) => typedIpcRender.invoke("shell:kill", ...args),
  resize: (...args) => typedIpcRender.send("shell:resize", ...args),
  write: (...args) => typedIpcRender.send("shell:write", ...args),
  onChange: (pid, callback) => {
    const listener: CombinedCallback<
      IpcRendererEventCallback,
      shellChangeCallback
    > = (_, id, chunk) => {
      if (pid == id) {
        callback(id, chunk);
      }
    };

    typedIpcRender.on(`shell:change`, listener);

    return () => {
      typedIpcRender.removeListener("shell:change", listener);
    };
  },

  onExit: (pid, callback) => {
    const listener: CombinedCallback<
      IpcRendererEventCallback,
      onShellExitCallback
    > = (_, id) => {
      if (pid === id) {
        callback(id);
      }
    };

    typedIpcRender.on("shell:exit", listener);

    return () => {
      typedIpcRender.removeListener("shell:exit", listener);
    };
  },
};

const gitApi: gitApi = {
  hasGit: (...args) => typedIpcRender.invoke("has:git", ...args),
  isGitInitialized: (...args) => typedIpcRender.invoke("git:is:init", ...args),
  initializeGit: (...args) => typedIpcRender.invoke("git:init", ...args),
  gitStatus: (...args) => typedIpcRender.invoke("git:status", ...args),
};

const fsearchApi: fsearchApi = {
  search: (...args) => typedIpcRender.invoke("fsearch", ...args),
};

const clipboardApi: clipboardApi = {
  writeImage: (...args) =>
    typedIpcRender.invoke("clipboard:write:image", ...args),
};

const storeApi: storeApi = {
  set: (...args) => typedIpcRender.invoke("store:set", ...args),
  onChange: (key, callback) => {
    const listener: CombinedCallback<
      IpcRendererEventCallback,
      storeChangeCallback
    > = (_, changedKey, newContent) => {
      if (changedKey === key) {
        callback(changedKey, newContent);
      }
    };

    typedIpcRender.on(`store:changed`, listener);

    return () => {
      typedIpcRender.removeListener("store:changed", listener);
    };
  },
  clean: (...args) => typedIpcRender.invoke("store:clean", ...args),
  get: (...args) => typedIpcRender.invoke("store:get", ...args),
  remove: (...args) => typedIpcRender.invoke("store:remove", ...args),
};

const api: ElectronApi = {
  ripgrepApi,
  fsearchApi,
  gitApi,
  clipboardApi,
  shellApi,
  pathApi,
  fsApi,
  chromeWindowApi,
  lspClient,
  fileXApi,
  storeApi,
  commandServer,
};

contextBridge.exposeInMainWorld("electronApi", api);
