import { Logger } from "node-logy";

/**
 * Out logger instace
 */
export const logger = new Logger({
  showCallSite: true,
  saveToLogFiles: true,
  timestampType: "short",
});