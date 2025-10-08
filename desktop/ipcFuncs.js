/**
 * File contains all our impl of electron api funcs to be exposed in the electron api to render
 */

const fsp = require("fs/promises");

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

module.exports = {
  readFileImpl,
};
