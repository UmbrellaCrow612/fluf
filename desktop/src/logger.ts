import { Logger } from "node-logy";

/**
 * Our logger instace
 */
export const logger = new Logger({
  showCallSite: true,
  saveToLogFiles: true,
  timestampType: "short",
  callSiteOptions: {
    fullFilePath: true,
  },
});
