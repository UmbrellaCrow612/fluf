import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';

/**
 * Gets the syntax highlting extension for a given file extension
 * @param ext The files extension
 * @returns Code mirror lang extension for syntax highlting
 */
export function getLanguageExtension(ext: string) {
  switch (ext.toLowerCase()) {
    case '.html':
      return html();
    case '.css':
      return css();
    case '.js':
    case '.mjs':
    case '.cjs':
    case '.ts':
      return javascript();

    case '.py':
      return python();

    default:
      return []; // No highlighting fallback
  }
}
