/**
 * File contains all our impl of electron api funcs to be exposed in the electron api to render
 */

const { dialog, BrowserWindow, ipcRenderer } = require("electron");
const fsp = require("fs/promises");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

/**
 * @type {readFile}
 */
const readFileImpl = async (event = undefined, filePath) => {
  if (!filePath) {
    console.log("File path not passed");
    return "";
  }

  try {
    let fc = await fsp.readFile(filePath, { encoding: "utf-8" });
    return fc;
  } catch (error) {
    console.log(error);
    return "";
  }
};

/**
 * @type {readDir}
 */
const readDirImpl = async (event = undefined, directoryPath) => {
  let items = await fsp.readdir(directoryPath, { withFileTypes: true });

  // Map to include metadata
  /**@type {Array<fileNode>} */
  let mappedItems = items.map((item) => ({
    name: item.name,
    path: path.join(directoryPath, item.name),
    isDirectory: item.isDirectory(),
    children: [],
    expanded: false,
    parentPath: directoryPath,
    mode: "default",
  }));

  // Sort: folders first, then files — both alphabetically
  mappedItems.sort((a, b) => {
    // If one is a folder and the other is not
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    // Otherwise, sort alphabetically by name
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });

  return mappedItems;
};

/**
 * @type {selectFolder}
 */
const selectFolderImpl = async (event = undefined) => {
  return await dialog.showOpenDialog({ properties: ["openDirectory"] });
};

/**
 * @type {exists}
 */
const existsImpl = async (_event = undefined, path) => {
  try {
    return fs.existsSync(path);
  } catch (error) {
    console.log("Error with exists function");
    return false;
  }
};

/**
 * @type {minimize}
 */
const minimizeImpl = (_event = undefined) => {
  const webContents = _event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  win.minimize();
};

/**
 * @type {maximize}
 */
const maximizeImpl = (_event = undefined) => {
  const webContents = _event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  win.maximize();
};

/**
 * @type {close}
 */
const closeImpl = (_event = undefined) => {
  const webContents = _event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  win.close();
};

/**
 * @type {isMaximized}
 */
const isMaximizedImpl = async (_event = undefined) => {
  const webContents = _event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  return win.isMaximized();
};

/**
 * @type {restore}
 */
const restoreImpl = (_event = undefined) => {
  const webContents = _event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  win.restore();
};

/**
 * @type {normalize}
 */
const normalizeImpl = async (_event = undefined, p) => {
  return path.normalize(p);
};

/**
 * @type {createFile}
 */
const createFileImpl = async (_event = undefined, destinationPath) => {
  try {
    await fsp.mkdir(path.dirname(destinationPath), { recursive: true });

    await fsp.writeFile(destinationPath, "");
    return true;
  } catch (error) {
    console.error("Error creating file:", error);
    return false;
  }
};

/**
 * @type {fileExists}
 */
const fileExistsImpl = async (_event = undefined, fp) => {
  try {
    const stats = await fsp.stat(fp);
    return stats.isFile();
  } catch (err) {
    if (err.code === "ENOENT") return false;
    throw err;
  }
};

/**
 * @type {directoryExists}
 */
const directoryExistsImpl = async (_event = undefined, fp) => {
  try {
    const stats = await fsp.stat(fp);
    return stats.isDirectory();
  } catch (err) {
    if (err.code === "ENOENT") return false;
    throw err;
  }
};

/**
 * @type {createDirectory}
 */
const createDirectoryImpl = async (_event = undefined, fp) => {
  try {
    await fsp.mkdir(fp, { recursive: false });
    return true; // folder created
  } catch (err) {
    if (err.code === "EEXIST") {
      return false;
    }
    throw err;
  }
};

/**
 * @type {deleteFile}
 */
const deleteFileImpl = async (_event = undefined, fp) => {
  try {
    const resolvedPath = path.resolve(fp);

    await fsp.unlink(resolvedPath);

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

/**
 * @type {deleteDirectory}
 */
const deletDirectoryImpl = async (_event = undefined, dp) => {
  try {
    const resolvedPath = path.resolve(dp);

    await fsp.rm(resolvedPath, { recursive: true, force: false });

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

/**
 * Contains all active terminals
 * @type {Map<string, terminal>}
 */
const terminalStore = new Map();

const cleanupTerminals = () => {
  Array.from(terminalStore.entries()).forEach(([id, term]) => {
    try {
      console.log("Killing term " + term.id);
      term.process.kill();
      console.log("Term " + term.id + " Killed");

      if (term.webContents && !term.webContents.isDestroyed()) {
        term.webContents.send("terminal-exit", { id: term.id });
      }
    } catch (err) {
      console.error(`Failed to kill terminal ${id}:`, err);
    } finally {
      terminalStore.delete(id);
    }
  });
};

/**
 * Creates a new terminal instance
 * @type {createTerminal}
 */
const createTerminalImpl = async (_event = undefined, dir) => {
  const MAX_OUTPUT_LINES = 70; // max number of output lines to keep

  try {
    const shell =
      process.platform === "win32"
        ? "cmd.exe"
        : process.env.SHELL || "/bin/bash";

    const webContents = _event?.sender;

    const termProcess = spawn(shell, [], {
      cwd: dir,
      env: process.env,
      shell: true,
    });

    /** @type {terminal} */
    const term = {
      id: crypto.randomUUID(),
      shell: shell,
      directory: dir,
      history: [],
      output: [],
      process: termProcess,
      webContents: webContents,
    };

    const sendToTerminal = (chunk) => {
      if (term.webContents && !term.webContents.isDestroyed()) {
        const chunkStr = chunk.toString();

        term.output.push(chunkStr);

        if (term.output.length > MAX_OUTPUT_LINES) {
          term.output = term.output.slice(-MAX_OUTPUT_LINES);
        }

        term.webContents.send("terminal-data", {
          id: term.id,
          chunk: chunkStr,
        });
      }
    };

    termProcess.stdout.on("data", sendToTerminal);

    termProcess.stderr.on("data", sendToTerminal);

    termProcess.on("exit", (code, signal) => {
      sendToTerminal(
        `\nProcess exited with code ${code}${
          signal ? `, signal ${signal}` : ""
        }\n`
      );
    });

    terminalStore.set(term.id, term);

    return {
      directory: term.directory,
      history: term.history,
      id: term.id,
      shell: term.shell,
      output: term.output,
    };
  } catch (error) {
    console.log(error);
    return undefined;
  }
};

/**
 * Run a command inside an existing terminal\
 * @type {runCmdInTerminal}
 */
const runCommandInTerminalImpl = async (_event = undefined, id, cmd) => {
  try {
    if (!cmd?.trim()) return false;

    const term = terminalStore.get(id);
    if (!term) {
      console.log("Could not find term " + id);
      return false;
    }

    term.history.push(cmd);
    term.process.stdin.write(`${cmd}\n`);

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

/**
 * @type {killTerminal}
 */
const killTerminalImpl = async (_event = undefined, termId) => {
  try {
    let t = terminalStore.get(termId);
    if (!t) {
      console.log("Terminal not found");
      return false;
    }

    t.process.kill();
    terminalStore.delete(t.id);

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};

/** @type {getTerminalInformation} */
const getTerminalInformationImpl = async (_event = undefined, termId) => {
  let term = terminalStore.get(termId);

  /** @type {terminalInformation | undefined} */
  let info = term
    ? {
        directory: term.directory,
        history: term.history,
        id: term.id,
        shell: term.shell,
        output: term.output,
      }
    : undefined;
  return info;
};

/** @type {restoreTerminals} */
const restoreTerminalsImpl = async (_event = undefined, terms) => {
  const MAX_OUTPUT_LINES = 70; // max number of output lines to keep

  /** @type {string[]} */
  let unsuc = [];

  for (let term of terms) {
    if (terminalStore.has(term.id)) {
      unsuc.push(term.id);
      continue;
    }

    const webContents = _event?.sender;

    const termProcess = spawn(term.shell, [], {
      cwd: term.directory,
      env: process.env,
      shell: true,
    });

    /** @type {terminal} */
    const terminal = {
      id: term.id,
      shell: term.shell,
      directory: term.directory,
      history: term.history,
      output: term.output,
      process: termProcess,
      webContents: webContents,
    };

    const sendToTerminal = (chunk) => {
      if (terminal.webContents && !terminal.webContents.isDestroyed()) {
        const chunkStr = chunk.toString();

        terminal.output.push(chunkStr);

        if (terminal.output.length > MAX_OUTPUT_LINES) {
          terminal.output = terminal.output.slice(-MAX_OUTPUT_LINES);
        }

        terminal.webContents.send("terminal-data", {
          id: term.id,
          chunk: chunkStr,
        });
      }
    };

    termProcess.stdout.on("data", sendToTerminal);

    termProcess.stderr.on("data", sendToTerminal);

    termProcess.on("exit", (code, signal) => {
      sendToTerminal(
        `\nProcess exited with code ${code}${
          signal ? `, signal ${signal}` : ""
        }\n`
      );
    });

    terminalStore.set(terminal.id, terminal);
  }

  return unsuc;
};

/**
 * List of watchers active by key directory path and value the watcher
 * @type {Map<string, import("fs").FSWatcher>}
 */
const watchersStore = new Map();

/** @type {watchDirectory} */
const watchDirectoryImpl = async (_event = undefined, dirPath) => {
  if (!fs.existsSync(dirPath)) return false;

  if (watchersStore.has(dirPath)) return true;

  const watcher = fs.watch(
    dirPath,
    { persistent: true },
    (eventType, filename) => {
      if (filename) {
        /** @type {directoryChangedData} */
        let dirChangedData = {
          dirPath,
          eventType,
          filename,
        };
        _event?.sender.send("dir:changed", dirChangedData);
      }
    }
  );

  watchersStore.set(dirPath, watcher);

  return true;
};

/** @type {unwatchDirectory} */
const unwatchDirectoryImpl = async (_event = undefined, dp) => {
  const watcher = watchersStore.get(dp);
  if (watcher) {
    watcher.close();
    watchersStore.delete(dp);
    return true;
  }
  return false;
};

const cleanUpWatchers = () => {
  Array.from(watchersStore.entries()).forEach(([dirPath, watcher]) => {
    watcher.close();
    watchersStore.delete(dirPath);
  });
};

module.exports = {
  readFileImpl,
  readDirImpl,
  selectFolderImpl,
  existsImpl,
  minimizeImpl,
  maximizeImpl,
  closeImpl,
  isMaximizedImpl,
  restoreImpl,
  normalizeImpl,
  createFileImpl,
  fileExistsImpl,
  directoryExistsImpl,
  createDirectoryImpl,
  deleteFileImpl,
  deletDirectoryImpl,
  runCommandInTerminalImpl,
  createTerminalImpl,
  cleanupTerminals,
  killTerminalImpl,
  getTerminalInformationImpl,
  restoreTerminalsImpl,
  watchDirectoryImpl,
  unwatchDirectoryImpl,
  cleanUpWatchers,
};
