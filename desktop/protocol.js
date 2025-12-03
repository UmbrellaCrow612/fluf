/*
    Offers a function called once which registers all protocols bnefore app ready
 */

const { protocol } = require("electron");
const { registerPdfProtocol } = require("./pdf");

function registerProtocols() {
  registerPdfProtocol(protocol);
}

module.exports = { registerProtocols };
