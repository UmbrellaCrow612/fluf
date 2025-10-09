import { Injectable } from '@angular/core';

/**
 * Represents the application context.
 */
export interface AppContext {
  /**
   * The current section of the editor or application where the user has focus,
   * e.g., "file", "terminal", etc.
   */
  section: string;
}

/**
 * Service that holds and manages the application context state.
 */
@Injectable({
  providedIn: 'root',
})
export class ContextService {
  /**
   * The current application context.
   */
  private _context: AppContext = {
    section: 'init',
  };

  /**
   * Retrieves the current application context synchronously.
   * @returns {AppContext} The current application context.
   */
  getContext(): AppContext {
    return this._context;
  }

  /**
   * Updates the application context with a new value.
   * @param newContext - The new context to set.
   */
  setContext(newContext: AppContext) {
    this._context = {
      ...newContext,
    };
  }
}
