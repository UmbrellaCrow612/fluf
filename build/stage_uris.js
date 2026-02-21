const path = require("path");

const STAGE_ONE_BASE_DIR = path.join(__dirname, "../", "stage_one");
const STAGE_TWO_ASAR_PATH = path.join(__dirname, "../", "app.asar")

module.exports = { STAGE_ONE_BASE_DIR, STAGE_TWO_ASAR_PATH };
