/**
 * Contains all the code to interact with fsearch
 */

const path = require("path");
const fs = require("fs");

/** @type {fsearchOptions} */
const defaultSearchOptions = {
  directory: ".",
  term: "default",
  count: false,
  debug: false,
  depth: 0,
  excludeDir: [],
  excludeExt: [],
  ext: [],
  hidden: false,
  ignoreCase: true,
  limit: 0,
  lines: 0,
  maxSize: 0,
  minSize: 0,
  modifiedAfter: "Empty",
  modifiedBefore: "Empty",
  open: false,
  partial: true,
  regex: false,
  sizeType: "B",
  type: "file",
};


/**
 * Parses the stdout captured from fsearch stdout and parsers it into reable data format
 * @param {string} stdout 
 * @returns {fsearchResult[]}
 */
const parseStdout = (stdout) => {
  return []
}

/**
 * Get the exe path of fsearch binary based on the platform where running on
 * @returns {string}
 */
const getExePath = () => {
  const platform = process.platform;

  // TODO add other platform
  // Also change it a bit for if it's running in electron final built as it might be diffrent

  let base = path.join(__dirname, "bin", "fsearch");
  let exePath;

  switch (platform) {
    case "win32":
      exePath = path.join(base, "windows", "fsearch.exe");
      break;

    default:
      break;
  }

  return exePath ?? "";
};

/**
 * Builds args array
 * @param {fsearchOptions} options
 * @returns {string[]} Args array
 */
const buildArgs = (options) => {
  return [];
};

/**
 * Search with fsearch binary
 * @param {fsearchOptions} options
 * @returns {Promise<fsearchResult[]>}
 */
const searchWithFSearch = (options) => {
  return new Promise((resolve, reject) => {
    try {
      let exePath = getExePath();
      if (!fs.existsSync(exePath)) {
        // reject
      }
      let args = buildArgs(options);

      // spawn 
      // caputre data
      // set timeout for kill 7 seconds


    } catch (error) {}
  });
};

/** @type {fsearch} */
const fsearchImpl = async (event, options) => {
  let newOptions = { ...defaultSearchOptions, ...options };
  return await searchWithFSearch(options);
};

/**
 * Register fsearch listeners
 * @param {import("electron").IpcMain} ipcMain
 */
function registerFsearchListeners(ipcMain) {}

module.exports = { registerFsearchListeners };
