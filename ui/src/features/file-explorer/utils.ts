/**
 * Gets the file extension of a given path if it is supported.
 * Returns null for directories, files without an extension, or unsupported extensions.
 *
 * @param {string} path - The file path to check.
 * @returns {SupportedFileExtensions} The file extension or null if unsupported.
 */
export function getFileExtension(path: string): SupportedFileExtensions {
  if (!path || typeof path !== 'string') return null;

  // Remove trailing slashes
  path = path.replace(/\/+$/, '');

  // Get last part of path
  const parts = path.split('/');
  const lastPart = parts[parts.length - 1];

  // Check for dot in file name
  const dotIndex = lastPart.lastIndexOf('.');
  if (dotIndex === -1 || dotIndex === 0) return null;

  const ext = lastPart.slice(dotIndex + 1).toLowerCase();

  // Only allow html, css, js
  if (ext === 'html' || ext === 'css' || ext === 'js') {
    return ext;
  }

  return null;
}

/**
 * List of supported file extenions
 */
export type SupportedFileExtensions = 'html' | 'css' | 'js' | null;
