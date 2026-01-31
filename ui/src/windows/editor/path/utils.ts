/**
 * Options for path normalization
 */
export interface NormalizePathOptions {
  /** Use forward slashes instead of backslashes (default: true) */
  forwardSlashes?: boolean;
  /** Remove trailing slash from path (default: true) */
  removeTrailingSlash?: boolean;
  /** Convert path to lowercase (default: true) */
  toLowerCase?: boolean;
}

/**
 * Normalizes file paths from Electron backend for consistent UI display
 * Handles Windows, macOS, and Linux path formats
 *
 * Use this whever you want to store a file path and then use it on a file path to be then used as a retriver
 *
 * @param path - The file path from the Electron backend
 * @param options - Configuration options
 * @returns Normalized path string
 */
export function normalizeElectronPath(
  path: string,
  options: NormalizePathOptions = {
    toLowerCase: true,
    removeTrailingSlash: true,
    forwardSlashes: true,
  },
): string {
  if (!path || typeof path !== 'string') {
    return '';
  }

  let normalized: string = path;

  // Replace backslashes with forward slashes if requested
  if (options.forwardSlashes) {
    normalized = normalized.replace(/\\/g, '/');
  }

  // Remove trailing slash/backslash (except for root paths)
  if (options.removeTrailingSlash) {
    normalized = normalized.replace(/[/\\]+$/, '');

    // Keep single slash for root or drive letter roots (C:/ or /)
    if (normalized.match(/^[a-zA-Z]:$/) || normalized === '') {
      normalized += '/';
    }
  }

  // Remove duplicate slashes (but preserve protocol slashes like file://)
  normalized = normalized.replace(/([^:])\/+/g, '$1/');

  // Convert to lowercase if requested (useful for case-insensitive comparison)
  if (options.toLowerCase) {
    normalized = normalized.toLowerCase();
  }

  return normalized;
}
