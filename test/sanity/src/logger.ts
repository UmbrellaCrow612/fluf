import { Logger } from "node-logy";

/**
 * Our logger instace
 */
export const logger = new Logger({
  saveToLogFiles: false,
  showCallSite: true,
  callSiteOptions: {
    fullFilePath: false,
  },
});
