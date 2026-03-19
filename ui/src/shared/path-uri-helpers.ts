/**
 * Normalizes a file path to be cross-platform compatible
 * Converts backslashes to forward slashes, resolves . and .. segments,
 * removes trailing slashes (except for root), and handles edge cases
 * @param inputPath The raw path string to normalize
 * @returns A normalized path using forward slashes
 */
export function normalizePath(inputPath: string): string {
  if (!inputPath || inputPath === '.') {
    return '.';
  }

  // Replace all backslashes with forward slashes
  let normalized = inputPath.replace(/\\/g, '/');

  // Handle Windows-style drive letters (e.g., C:/ → /c/)
  const driveLetterMatch = normalized.match(/^([a-zA-Z]):(\/|$)/);
  if (driveLetterMatch) {
    normalized = `/${driveLetterMatch[1].toLowerCase()}${driveLetterMatch[2] === '/' ? '/' : ''}${normalized.slice(3)}`;
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
      } else if (!normalized.startsWith('/')) {
        segments.push('..');
      }
    } else if (part !== '.') {
      segments.push(part);
    }
  }

  // Reconstruct path
  const isAbsolute = normalized.startsWith('/');
  let result = segments.join('/');

  // Preserve leading slash for absolute paths
  if (isAbsolute) {
    result = '/' + result;
  }

  // Handle root path case
  if (result === '' && isAbsolute) {
    result = '/';
  }

  // Keep trailing slash if original had one (and it's not root)
  const hadTrailingSlash = inputPath.endsWith('/') || inputPath.endsWith('\\');
  if (hadTrailingSlash && result !== '/' && result !== '') {
    result += '/';
  }

  return result || '.';
}
