/**
 * Contains the code for python lsp
 * 
 * DOCS: https://microsoft.github.io/pyright/#/
 */

const { logger } = require("./logger");
const { getPythonServerPath } = require("./packing");
const fs = require("fs");

function startPythonLanguageServer() {
  let path = getPythonServerPath();
  if (!fs.existsSync(path)) {
    logger.error("Python language server not found " + path);
    return;
  }
}

function stopPythonLanguageServer() {}

module.exports = {
  startPythonLanguageServer,
  stopPythonLanguageServer,
};
