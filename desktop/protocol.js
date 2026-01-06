/*
    Offers a function called once which registers all protocols bnefore app ready
 */

const { protocol } = require("electron");
const { registerPdfProtocol } = require("./pdf");
const { registerImageProtocol } = require("./image");

/**
 * Called once before app ready to define protocol schemes
 */
function registerProtocols() {
  registerPdfProtocol(protocol);
  registerImageProtocol(protocol);
}

module.exports = { registerProtocols };
