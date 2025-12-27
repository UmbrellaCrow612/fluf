/**
 * Contains all api code for interacting with git via electron
 */

const { spawn } = require("child_process");
const fs = require("fs/promises");
const path = require("path");
const { logger } = require("./logger");

/**
 * Abort controller used to watch the git repo
 * @type {null | AbortController}
 */
let abortController = null;

/**
 * Ref to the main window
 * @type {import("electron").BrowserWindow | null}
 */
let mainWindowRef = null

/**
 * Parses the stdout from `git status` and returns a structured JSON object.
 *
 * @param {string} stdout - The raw stdout string from `git status`
 * @returns {import("./type").gitStatusResult} A structured representation of the git status
 */
function parseGitStatus(stdout) {
  const lines = stdout.split(/\r?\n/);
  /** @type {import("./type").gitStatusResult} */
  const result = {
    branch: null,
    branchStatus: null,
    staged: [],
    unstaged: [],
    untracked: [],
    ignored: [],
    clean: false,
  };

  /** @type {import("./type").gitSection} */
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
          /** @type {import("./type").gitFileEntry} */
          const entry = {
            status: /** @type {import("./type").gitFileStatus} */ (
              status || "untracked"
            ),
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

/**
 * Registers all listeners and handlers for git
 * @param {import("electron").IpcMain} ipcMain
 * @param {import("electron").BrowserWindow} mainWindow
 */
const registerGitListeners = (ipcMain, mainWindow) => {
  mainWindowRef = mainWindow

  ipcMain.handle("has:git", async () => {
    try {
      const version = await runGitCommand(["--version"], process.cwd());
      return version.startsWith("git");
    } catch {
      return false;
    }
  });

  ipcMain.handle("git:init", async (event, dir) => {
    let p = path.normalize(path.resolve(dir));

    try {
      await runGitCommand(["init"], p);

      return true;
    } catch (error) {
      logger.error(
        "Failed to init git repo " + p + " " + JSON.stringify(error)
      );
      return false;
    }
  });

  ipcMain.handle("git:is:init", async (event, dir) => {
    let gitPath = path.join(path.normalize(path.resolve(dir)), ".git");

    try {
      await fs.access(gitPath);
    } catch (error) {
      return false;
    }
  });

  ipcMain.handle("git:watch", async (event, dir) => {
    try {
      let p = path.normalize(path.resolve(dir));

      if (abortController) {
        logger.info("Repo already watched for git watch" + p);
        return;
      }
      abortController = new AbortController();

      let watcher = fs.watch(p, {
        recursive: true,
        encoding: "utf-8",
        signal: abortController.signal,
      });

      for await (const event of watcher) {
        if(mainWindowRef){
          mainWindowRef.webContents.send("git:change", event)
        }
      }
      return true;
    } catch (error) {
      logger.error("Failed to watch git repo " + JSON.stringify(error));
      return false;
    }
  });

  ipcMain.handle("git:status", async (event, dir) => {});
};

module.exports = {
  registerGitListeners,
};
