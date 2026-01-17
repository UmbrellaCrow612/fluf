/**
 * @typedef {import("../type").languageId} languageId
 */

const { logger } = require("../logger");

/**
 * @typedef {import("../type").ILanguageServer} ILanguageServer
 */

/**
 * Used as a way to register and manage language servers
 */
class LanguageServerManager {
  /**
   * Holds a language and it's LSP impl
   *
   * - Key - @see {languageId} The specific language
   * - Value - @see {ILanguageServer} The language server impl
   * 
   * @type {Map<languageId, ILanguageServer>}
   */
  #languageLspMap = new Map();

  /**
   * Register a language and it's LSP implementation
   * @param {languageId} languageId - The specific language
   * @param {ILanguageServer} lsp - The languages implementation of the LSP
   */
  Register(languageId, lsp) {
    if (this.#languageLspMap.has(languageId)) {
      logger.warn(
        `Language server already registered languageId: ${languageId}`,
      );
      return;
    }

    this.#languageLspMap.set(languageId, lsp);
  }

  /**
   * Get the implementation of a specific languages LSP if it was registered
   * @param {languageId} languageId - The specific language
   * @returns {ILanguageServer | undefined} - The languages LSP if it was registered or nothing
   */
  Get(languageId) {
    return this.#languageLspMap.get(languageId);
  }

  /**
   * Get all language servers registered
   * @returns {ILanguageServer[]} List of language servers registered
   */
  GetAll(){
    return Array.from(this.#languageLspMap.values())
  }
}

module.exports = { LanguageServerManager };
