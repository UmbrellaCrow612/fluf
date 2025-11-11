/**
 * Contains all api code for interacting with git via electron
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * Parses the stdout from `git status` and returns a structured JSON object.
 *
 * @param {string} stdout - The raw stdout string from `git status`
 * @returns {gitStatusResult} A structured representation of the git status
 */
function parseGitStatus(stdout) {
  const lines = stdout.split(/\r?\n/);
  /** @type {gitStatusResult} */ 
  const result = {
    branch: null,
    branchStatus: null,
    staged: [],
    unstaged: [],
    untracked: [],
    ignored: [],
    clean: false,
  };

  /** @type {gitSection} */
  let section = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip git hint lines
    if (trimmed.startsWith("(use ")) continue;
    if (trimmed.startsWith("(all conflicts")) continue;
    if (trimmed.startsWith("(fix conflicts")) continue;
    if (trimmed.startsWith("no changes added")) continue;

    // --- Branch info ---
    if (trimmed.startsWith("On branch")) {
      result.branch = trimmed.replace("On branch ", "").trim();
      continue;
    }

    if (trimmed.startsWith("Your branch")) {
      result.branchStatus = trimmed;
      continue;
    }

    // --- Section markers ---
    if (trimmed.startsWith("Changes to be committed:")) {
      section = "staged";
      continue;
    }
    if (trimmed.startsWith("Changes not staged for commit:")) {
      section = "unstaged";
      continue;
    }
    if (trimmed.startsWith("Untracked files:")) {
      section = "untracked";
      continue;
    }
    if (trimmed.startsWith("Ignored files:")) {
      section = "ignored";
      continue;
    }

    if (trimmed.includes("nothing to commit, working tree clean")) {
      result.clean = true;
      continue;
    }

    // --- Parse file lines within known sections ---
    if (
      section &&
      ["staged", "unstaged", "untracked", "ignored"].includes(section)
    ) {
      const match = trimmed.match(
        /^(modified:|deleted:|new file:|renamed:|.+->.+)?\s*(.+)$/
      );
      if (match) {
        let status = match[1] ? match[1].replace(":", "").trim() : null;
        let file = match[2] ? match[2].trim() : null;

        if (file) {
          /** @type {gitFileEntry} */
          const entry = {
            status: /** @type {gitFileStatus} */ (status || "untracked"),
            file,
          };

          result[
            /** @type {"staged"|"unstaged"|"untracked"|"ignored"} */ (section)
          ].push(entry);
        }
      }
    }
  }

  return result;
}

/**
 * Spawn a Git command and return structured output
 * @param {string[]} args - List of args to run ["init"]
 * @param {string} cwd - The directory to run the cmds in
 * @param {number} [timeOut=5000] - The timeout for a git cmd's to take before it fails
 * @returns {Promise<string>}
 */
function runGitCommand(args, cwd, timeOut = 5000) {
  return new Promise((resolve, reject) => {
    if (!cwd || !fs.existsSync(cwd) || !fs.statSync(cwd).isDirectory()) {
      return reject(new Error("Invalid working directory"));
    }

    const gitProc = spawn("git", args, { cwd });

    let stdoutData = "";
    let stderrData = "";
    let finished = false;

    const timeout = setTimeout(() => {
      if (!finished) {
        finished = true;
        gitProc.kill("SIGTERM");
        reject(new Error("Git command timed out"));
      }
    }, timeOut);

    gitProc.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });

    gitProc.stderr.on("data", (data) => {
      stderrData += data.toString();
    });

    gitProc.on("close", (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);

      if (code !== 0) {
        return reject(
          new Error(stderrData.trim() || `Git exited with code ${code}`)
        );
      }

      resolve(stdoutData.trim());
    });
  });
}

/** @type {hasGit} */
const hasGitImpl = async (_event) => {
  try {
    const version = await runGitCommand(["--version"], process.cwd());
    return version.startsWith("git");
  } catch {
    return false;
  }
};

/** @type {initializeGit} */
const initializeGitImpl = async (_event, dir) => {
  if (!_event || !dir) {
    return { error: "Params", success: false };
  }

  try {
    await runGitCommand(["init"], dir);
    return { error: null, success: true };
  } catch (/** @type {any} */ err) {
    return { error: err?.message, success: false };
  }
};

/** @type {isGitInitialized} */
const isGitInitializedImpl = async (_event, dir) => {
  if (!dir) {
    console.log("Param dir not passed");
    return false;
  }

  return fs.existsSync(path.join(dir, ".git"));
};

/**
 * Unsub watcher logic
 * @type {voidCallback | null}
 */
let gitWatcher = null;
/** Flag to track if watch logic has been run  */
let isWatchingGitRepo = false;

/** @type {watchGitRepo} */
const watchGitRepoImpl = async (_event, dir) => {
  if (isWatchingGitRepo) {
    console.log("Already watching git repo");
    return true;
  }

  if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    console.log("Invalid directory:", dir);
    return false;
  }

  const sender = _event?.sender;

  /** @type {NodeJS.Timeout | null} */
  let debounceTimer = null;
  const debounceDelay = 500;

  const notifyChange = async () => {
    try {
      const stdout = await runGitCommand(["status"], dir);

      let data = parseGitStatus(stdout);
      sender?.send("git:change", data);
    } catch (err) {
      console.error("Error checking git status:", err);
    }
  };

  const debounceNotify = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => notifyChange(), debounceDelay);
  };

  const watcher = fs.watch(dir, { recursive: true }, (_, filename) => {
    if (filename) {
      const parts = filename.split(path.sep);
      if (parts.some((part) => part.startsWith("."))) {
        return;
      }
      debounceNotify();
    }
  });

  gitWatcher = () => watcher.close();
  isWatchingGitRepo = true;

  console.log("Watching repository for changes:", dir);

  return true;
};

/**
 * Stops watching files
 */
function stopWatchingGitRepo() {
  if (gitWatcher) {
    gitWatcher();
    gitWatcher = null;
    isWatchingGitRepo = false;
    console.log("Stopped watching repository");
    return true;
  }
  return false;
}

/**
 * Registers all listeners and handlers for git
 * @param {import("electron").IpcMain} ipcMain
 */
const registerGitListeners = (ipcMain) => {
  ipcMain.handle("has:git", hasGitImpl);
  ipcMain.handle("git:init", initializeGitImpl);
  ipcMain.handle("git:is:init", isGitInitializedImpl);
  ipcMain.handle("git:watch", watchGitRepoImpl);
};

module.exports = {
  registerGitListeners,
  stopWatchingGitRepo,
};
