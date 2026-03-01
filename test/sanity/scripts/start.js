import { safeRun, runCommand, isInsideGithubAction } from "node-github-actions";
import { Logger } from "node-logy";

const logger = new Logger({
  saveToLogFiles: !isInsideGithubAction(),
  showCallSite: true,
});

safeRun(async () => {}, {
  exitFailCode: 1,
  exitOnFailed: true,
  onFail: async (err) => {
    logger.error("Start failed ", err);
    await logger.flush();
    await logger.shutdown();
  },
  timeoutMs: 10 * 60 * 1000, // whole test suite
});
