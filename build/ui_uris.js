const path = require("path");

const UI_BASE_PATH = path.join(__dirname, "../", "ui");
const UI_BUILD_OUTPUT_PATH = path.join(UI_BASE_PATH, "dist", "ui", "browser");

module.exports = { UI_BASE_PATH , UI_BUILD_OUTPUT_PATH};
