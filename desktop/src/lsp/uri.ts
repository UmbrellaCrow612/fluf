import path from "path";
import { assertString } from "../assert.js";

/**
 * Converts a local file path into an LSP-compliant DocumentUri.
 *
 * A DocumentUri is a string representation of a URI that follows RFC 3986.
 * On Windows, drive letters are uppercased and properly encoded.
 *
 * @param {string} filePath - The relative or absolute path to a file.
 * @returns {string} The LSP-compliant DocumentUri string.
 *
 * @example
 * createUri('C:\\project\\readme.md'); // 'file:///C:/project/readme.md'
 * createUri('./file.txt');             // 'file:///absolute/path/to/file.txt'
 * createUri('/home/user/file.txt');    // 'file:///home/user/file.txt'
 */
export function createUri(filePath: string): string {
  assertString(filePath);

  // Resolve relative paths to absolute
  let absolutePath = path.normalize(path.resolve(filePath));

  // On Windows, replace backslashes with forward slashes
  absolutePath = absolutePath.replace(/\\/g, "/");

  // Encode special characters for URI (except ':' in drive letters)
  let prefix = "";
  if (/^[a-zA-Z]:/.test(absolutePath)) {
    // Windows drive letter: C:/path → /C:/path
    prefix = "/";
  }

  const parts = absolutePath.split("/").map(encodeURIComponent);
  const uriPath = prefix + parts.join("/");

  return `file://${uriPath}`;
}

/**
 * Check if a string is a valid document URI
 * @param {string} uri - The string to check
 * @returns {boolean} True if the string is a valid file URI, false otherwise
 */
export function isUri(uri: string): boolean {
  if (typeof uri !== "string" || uri.length === 0) {
    return false;
  }

  return uri.startsWith("file://");
}

/**
 * Assert a value is a valid file URI (DocumentUri)
 * @param value The value to assert as a URI
 * @throws Error if the value isn't a string or isn't a valid file URI
 */
export function assertUri(value: any): void {
  assertString(value);

  if (!isUri(value)) {
    throw new Error(
      `Assertion failed: received "${value}" but expected a valid file URI (e.g., "file:///path/to/file")`,
    );
  }
}
