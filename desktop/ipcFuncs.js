/**
 * File contains all our impl of electron api funcs to be exposed in the electron api to render
 */

const { dialog, BrowserWindow } = require("electron");
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
      if (term.process) {
        console.log("Killed term " + term.id);
        term.process.kill();
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
  try {
    const shell =
      process.platform === "win32"
        ? "cmd.exe"
        : process.env.SHELL || "/bin/bash";

    const termProcess = spawn(shell, [], {
      cwd: dir,
      env: process.env,
      shell: true,
    });

    /** @type {terminal} */
    const term = {
      id: crypto.randomUUID(),
      shell,
      directory: dir,
      history: [],
      output: "",
      process: termProcess,
    };

    termProcess.stdout.on("data", (data) => {
      const text = data.toString();
      if (term.output.length > 1000) {
        term.output = "";
      }
      term.output += text;

      /**
       * @type {terminalData}
       */
      let termData = {
        id: term.id,
        output: text,
      };

      let channel = `terminal:data:${term.id}`;
      _event?.sender?.send(channel, termData);
    });

    termProcess.on("exit", (code) => {
      /**
       * @type {terminalExit}
       */
      let termData = {
        id: term.id,
        code: code,
      };

      let channel = `terminal:exit:${term.id}`;
      _event?.sender?.send(channel, termData);

      terminalStore.delete(term.id);
    });

    terminalStore.set(term.id, term);

    return true;
  } catch (error) {
    console.log(error);
    return false;
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
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
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
  killTerminalImpl
};
