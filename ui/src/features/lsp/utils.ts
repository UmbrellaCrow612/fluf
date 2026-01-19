/**
 * Contains utils related to LSP (Language server protocol) logic
 */

import { languageId } from '../../gen/type';

/**
 * Get the specific language server needed for the file based on it's extension
 * @param extension The file extension
 * @returns Lang server or null
 */
export function getLanguageId(extension: string): languageId | null {
  switch (extension) {
    case '.go':
      return 'go';

    case '.py':
      return 'python';

    default:
      console.log('Unsuported language server for file');
      return null;
  }
}
