/**
 * Contains utils related to LSP (Language server protocol) logic
 */

import { languageServer } from "../../gen/type";

/**
 * Get the specific language server needed for the file based on it's extension
 * @param extension The file extension
 * @returns Lang server or null
 */
export function getLanguageServer(extension: string): languageServer | null {
  switch (extension) {
    case '.js':
    case '.mjs':
    case '.cjs':
    case '.ts':
      return 'js/ts';

    case '.py':
      return 'python';

    default:
      console.log('Unsuported language server for file');
      return null;
  }
}
