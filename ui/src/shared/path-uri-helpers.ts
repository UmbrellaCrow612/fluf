/**
 * Normalizes a file path to be cross-platform compatible
 * Converts backslashes to forward slashes, resolves . and .. segments,
 * removes trailing slashes (except for root), and preserves Windows drive letters
 * @param inputPath The raw path string to normalize
 * @returns A normalized path using forward slashes, with Windows drive letters preserved (e.g., C:/foo)
 */
export function normalizePath(inputPath: string): string {
  if (!inputPath || inputPath === '.') {
    return '.';
  }

  // Replace all backslashes with forward slashes
  let normalized = inputPath.replace(/\\/g, '/');

  // Detect and preserve Windows-style drive letters (e.g., C:/ or c:/)
  // Capture the drive letter but DON'T convert to /c/ format
  let driveLetter = '';
  const driveLetterMatch = normalized.match(/^([a-zA-Z]):\//);
  if (driveLetterMatch) {
    driveLetter = driveLetterMatch[1].toLowerCase() + ':/';
    normalized = normalized.slice(3); // Remove the drive letter part from the path to process
  }

  // Split into segments and process . and ..
  const segments: string[] = [];
  const parts = normalized.split('/').filter((part) => part !== '');

  for (const part of parts) {
    if (part === '..') {
      // Pop last segment if possible, otherwise keep .. (for relative paths above root)
      const last = segments[segments.length - 1];
      if (last && last !== '..') {
        segments.pop();
      } else if (!driveLetter && !normalized.startsWith('/')) {
        // Only allow .. if it's a relative path without drive letter
        segments.push('..');
      }
    } else if (part !== '.') {
      segments.push(part);
    }
  }

  // Reconstruct path
  const isAbsolute = driveLetter !== '' || normalized.startsWith('/');
  let result = segments.join('/');

  // Prepend drive letter if present (preserving C:/ format)
  if (driveLetter) {
    result = driveLetter + result;
  } else if (isAbsolute) {
    // Preserve leading slash for absolute Unix paths
    result = '/' + result;
  }

  // Handle root path case
  if (result === '' && isAbsolute) {
    result = driveLetter || '/';
  }

  // Keep trailing slash if original had one (and it's not root)
  const hadTrailingSlash = inputPath.endsWith('/') || inputPath.endsWith('\\');
  if (
    hadTrailingSlash &&
    result !== '/' &&
    !result.endsWith(':/') &&
    result !== ''
  ) {
    result += '/';
  }

  return result || '.';
}
