/**
 * Converts forward slash to back slash
 * @param p The file path
 * @returns Fixed string
 */
export function canonicalPath(p: string): string {
  return p.replace(/\\/g, '/');
}
