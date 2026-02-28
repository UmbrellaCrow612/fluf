/**
 * Contains helper to work with ENV values
 */

/**
 * Shape of ENV object key value pairs of strings
 */
export interface KnownEnvValues  {
  MODE: "dev" | "prod";
  DEV_UI_PORT: string;
}

/**
 * Validates the values of ENV to have known defined values to the type defined
 */
export function validateEnv(): void {
  const mode = process.env["MODE"];
  const devUiPort = process.env["DEV_UI_PORT"];

  // Validate MODE
  if (!mode || (mode !== "dev" && mode !== "prod")) {
    throw new Error(`Invalid MODE value: "${mode}". Expected "dev" or "prod".`);
  }

  // Validate DEV_UI_PORT exists
  if (!devUiPort || typeof devUiPort !== "string") {
    throw new Error(`DEV_UI_PORT is not defined or not a string.`);
  }
}

/**
 * Used to get the ENV values from process - ASSUMES validation has passed
 * @returns Object of values
 */
export function getEnvValues(): KnownEnvValues {
  return {
    MODE: process.env["MODE"] as "dev" | "prod",
    DEV_UI_PORT: process.env["DEV_UI_PORT"] as string,
  };
}

