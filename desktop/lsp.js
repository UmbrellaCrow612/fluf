/**
 * Contains code related to LSP (Language server protocol)
 */

const path = require("path");

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
function createUri(filePath) {
  if (typeof filePath !== "string") {
    throw new TypeError("filePath must be a string");
  }

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

module.exports = { createUri };
