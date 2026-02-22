import { Logger } from "node-logy";
import { isPackaged } from "./packing.js";

/**
 * Our logger instace
 */
export const logger = new Logger({
  showCallSite: !isPackaged(),
  saveToLogFiles: true,
  timestampType: "short",
  callSiteOptions: {
    fullFilePath: true,
  },
});
