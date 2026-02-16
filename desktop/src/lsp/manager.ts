import { logger } from "../logger.js";
import type { ILanguageServer, languageId } from "../type.js";

/**
 * Used as a way to register and manage language servers
 */
export class LanguageServerManager {
  /**
   * Holds a language and it's LSP impl
   *
   * - Key - @see {languageId} The specific language
   * - Value - @see {ILanguageServer} The language server impl
   *
   * @type {Map<languageId, ILanguageServer>}
   */
  #languageLspMap: Map<languageId, ILanguageServer> = new Map();

  /**
   * Register a language and it's LSP implementation
   * @param {languageId} languageId - The specific language
   * @param {ILanguageServer} lsp - The languages implementation of the LSP
   */
  Register(languageId: languageId, lsp: ILanguageServer) {
    if (!languageId || typeof languageId !== "string")
      throw new TypeError("languageId must be a non-empty string");

    if (!lsp || typeof lsp !== "object")
      throw new TypeError("lsp must be an object");

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
  Get(languageId: languageId): ILanguageServer | undefined {
    if (!languageId || typeof languageId !== "string")
      throw new TypeError("languageId must be a non-empty string");

    return this.#languageLspMap.get(languageId);
  }

  /**
   * Get all language servers registered
   * @returns {ILanguageServer[]} List of language servers registered
   */
  GetAll(): ILanguageServer[] {
    return Array.from(this.#languageLspMap.values());
  }
}
