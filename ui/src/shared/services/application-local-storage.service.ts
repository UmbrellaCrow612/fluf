import { Injectable } from "@angular/core";

/**
 * Used to persist data locally for the application
 */
@Injectable({
  providedIn: "root",
})
export class ApplicationLocalStorageService {
  /**
   * Saves a value to localStorage under the given key.
   * Objects and arrays are automatically serialised to JSON.
   */
  set<T>(key: string, value: T): void {
    try {
      const serialised = JSON.stringify(value);
      localStorage.setItem(key, serialised);
    } catch (error) {
      console.error(`LocalStorageService: failed to save key "${key}"`, error);
    }
  }

  /**
   * Retrieves and deserialises a value from localStorage.
   * Returns `null` if the key does not exist or deserialisation fails.
   */
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`LocalStorageService: failed to read key "${key}"`, error);
      return null;
    }
  }

  /**
   * Retrieves a value, returning `defaultValue` if the key is absent.
   */
  getOrDefault<T>(key: string, defaultValue: T): T {
    const value = this.get<T>(key);
    return value !== null ? value : defaultValue;
  }

  /**
   * Removes a single entry from localStorage.
   */
  remove(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Removes all entries from localStorage.
   */
  clear(): void {
    localStorage.clear();
  }

  /**
   * Returns true if the given key exists in localStorage.
   */
  has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  /**
   * Returns all keys currently stored in localStorage.
   */
  keys(): string[] {
    return Object.keys(localStorage);
  }
}
