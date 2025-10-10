import { Injectable } from '@angular/core';

/**
 * Represents the application context.
 */
export interface AppContext {
  /**
   * The current section of the editor or application where the user has focus,
   * e.g., "file", "terminal", etc.
   */
  section: '' | 'editor';

  /**
   * The application selected directory folder that is in view.
   */
  directoryFolder: string;
}

/**
 * Service that holds and manages the application context state.
 */
@Injectable({
  providedIn: 'root',
})
export class ContextService {
  private readonly LOCAL_STORAGE_KEY = 'app_context';

  /**
   * The current application context.
   */
  private _context: AppContext = {
    section: '',
    directoryFolder: '',
  };

  constructor() {
    this.loadContextFromStorage();
  }

  /**
   * Loads the application context from localStorage (if available).
   */
  private loadContextFromStorage(): void {
    const savedContext = localStorage.getItem(this.LOCAL_STORAGE_KEY);
    if (savedContext) {
      try {
        this._context = JSON.parse(savedContext);
      } catch (error) {
        console.warn(
          'Failed to parse saved app context from localStorage:',
          error
        );
        this._context = { section: '', directoryFolder: '' };
      }
    }
  }

  /**
   * Saves the current application context to localStorage.
   */
  private saveContextToStorage(): void {
    localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(this._context));
  }

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
  setContext(newContext: AppContext): void {
    this._context = { ...newContext };
    this.saveContextToStorage();
  }

  /**
   * Clears the context (and removes it from localStorage).
   */
  clearContext(): void {
    this._context = { section: '', directoryFolder: '' };
    localStorage.removeItem(this.LOCAL_STORAGE_KEY);
  }
}
