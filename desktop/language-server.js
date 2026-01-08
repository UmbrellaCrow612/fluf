/*
    Contains all the code to register language servers into the app
*/

const { startTsServer, stopTsServer } = require("./typescript");

/**
 * Called before the window is created and starts all background language servers
 */
const startLanguageServers = () => {
  startTsServer();
};

/**
 * Called beofre the app quits and stops all the lnaguage servers
 */
const stopLanguageServers = () => {
  stopTsServer();
};

module.exports = { startLanguageServers, stopLanguageServers };
