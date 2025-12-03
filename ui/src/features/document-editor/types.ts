/**
 * List of document extensions that can be rendered in a browser via iframe or online viewers.
 */
export const docExtensions = ['pdf'] as const;

/**
 * Type representing all valid document extensions.
 */
export type DocExtension = (typeof docExtensions)[number];
