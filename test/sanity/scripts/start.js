import { safeRun, runCommand, isInsideGithubAction } from "node-github-actions";
import { Logger } from "node-logy";

const args = process.argv.slice(2);
const isProd = args.includes("--production-build");

const logger = new Logger({
  saveToLogFiles: !isInsideGithubAction(),
  showCallSite: true,
  basePath: "./logs",
});

logger.debug("Process arguments", {
  args,
  isProd,
  isInsideGithubAction: isInsideGithubAction(),
});
logger.debug("Environment variables", {
  NODE_ENV: process.env.NODE_ENV,
  PRODUCTION: process.env.PRODUCTION,
});

safeRun(
  async () => {
    logger.info("Starting test execution", {
      isProd,
      timestamp: new Date().toISOString(),
    });

    const env = {
      PRODUCTION: `${isProd}`,
    };
    logger.debug("Prepared environment variables", { env });

    const command = "npx";
    const commandArgs = ["playwright", "test"];
    const timeoutSeconds = 11 * 60;

    logger.info("Executing command", {
      command,
      args: commandArgs,
      timeout: `${timeoutSeconds}s`,
    });

    await runCommand(
      command,
      commandArgs,
      {
        env: {
          ...process.env,
          ...env,
        },
      },
      timeoutSeconds,
    );

    logger.info("Test execution completed successfully");
  },
  {
    exitFailCode: 1,
    exitOnFailed: true,
    onFail: async (err) => {
      logger.error("Test execution failed", err);
      await logger.flush();
      await logger.shutdown();
    },
    onAfter: async () => {
      logger.debug("Cleanup phase - flushing and shutting down logger");
      await logger.flush();
      await logger.shutdown();
    },
    timeoutMs: 12 * 60 * 1000,
  },
);
