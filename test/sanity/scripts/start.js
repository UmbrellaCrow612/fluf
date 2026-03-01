import { safeRun, runCommand, isInsideGithubAction } from "node-github-actions";
import { Logger } from "node-logy";

const args = process.argv.slice(2);
const isProd = args.includes("--production-build");

const logger = new Logger({
  saveToLogFiles: !isInsideGithubAction(),
  showCallSite: true,
  basePath: "./logs",
});

safeRun(
  async () => {
    const env = {
      PRODUCTION: `${isProd}`,
    };

    await runCommand(
      "npx",
      ["playwright", "test"],
      {
        env: {
          ...process.env,
          ...env,
        },
      },
      11 * 60, // in seconds
    );
  },
  {
    exitFailCode: 1,
    exitOnFailed: true,
    onFail: async (err) => {
      logger.error("Start failed ", err);
      await logger.flush();
      await logger.shutdown();
    },
    onAfter: async () => {
      await logger.flush();
      await logger.shutdown();
    },
    timeoutMs: 12 * 60 * 1000, // whole test suite, as we add more tests just increas it
  },
);
