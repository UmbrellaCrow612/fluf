import { imageTypes } from './types';

/**
 * Checks if a string contains any valid image extension such as .png, .jpeg, etc.
 * @param {string} str The string to check
 * @returns {boolean} True if the string contains an image extension
 */
export function hasImageExtension(str: string): boolean {
  if (!str) return false;

  return imageTypes.some(ext =>
    str.toLowerCase().includes(`${ext.toLowerCase()}`)
  );
}
