import { docExtensions } from "./types";

/**
 * Checks if a string contains any supported document extension.
 *
 * @param str - The string to check, usually a filename or URL.
 * @returns True if the string contains a document extension, false otherwise.
 *
 * @example
 * ```ts
 * hasDocumentExtension("file.pdf"); // true
 * hasDocumentExtension("image.png"); // false
 * ```
 */
export function hasDocumentExtension(str: string): boolean {
  const lowerStr = str.toLowerCase();
  return docExtensions.some((ext) => lowerStr.includes(ext));
}
