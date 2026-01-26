/**
 * Converts a file URI from an LSP (Language Server Protocol) to a normal file path.
 * Handles both Unix-style and Windows-style file URIs.
 * 
 * @param {string} uri - The file URI to convert (e.g., "file:///C:/dev/project/file.js")
 * @returns {string} The normalized file path (e.g., "C:/dev/project/file.js" on Windows, "/home/user/file.js" on Unix)
 * 
 * @example
 * // Windows
 * uriToFilePath("file:///C:/dev/project/main.go")
 * // Returns: "C:/dev/project/main.go"
 * 
 * @example
 * // Unix
 * uriToFilePath("file:///home/user/project/main.go")
 * // Returns: "/home/user/project/main.go"
 */
export function uriToFilePath(uri: string): string {
  // Remove the 'file://' protocol
  let path = uri.replace(/^file:\/\//, '');
  
  // Decode URI components FIRST (handles %20 for spaces, %3A for colons, etc.)
  path = decodeURIComponent(path);
  
  // On Windows, URIs have an extra leading slash before the drive letter
  // e.g., "file:///C:/..." becomes "/C:/..." and we need "C:/..."
  if (/^\/[a-zA-Z]:/.test(path)) {
    path = path.substring(1);
  }
  
  return path;
}