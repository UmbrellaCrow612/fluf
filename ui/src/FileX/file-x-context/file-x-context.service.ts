import { effect, Injectable, signal } from '@angular/core';
import { FileXAppContext, FileXTab } from './type';

const LOCAL_STORAGE_KEY = 'file-x-context';

/**
 * Base service that holds all persistant data between session for file x
 *
 * SHOULD NOT use any other service as it's a base service
 */
@Injectable({
  providedIn: 'root',
})
export class FileXContextService {
  constructor() {
    effect(() => {
      this.persist();
    });
  }

  /**
   * Reads the signals and then saves them
   */
  private persist() {
    const snapshot = this.getSnapShot();
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(snapshot));
    } catch (err) {
      console.error('[FileXContextService] Failed to persist context', err);
    }
  }

  getSnapShot(): FileXAppContext {
    return {
      tabs: this.tabs(),
      currentActiveDirectory: this.currentActiveDirectoryTab(),
    };
  }

  /**
   * Restore the state of a given field
   * @param key The specific field to restore
   * @param fallback A fallback value if it's invalid
   * @returns Value
   */
  private restoreField<K extends keyof FileXAppContext>(
    key: K,
    fallback: FileXAppContext[K],
  ): FileXAppContext[K] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return fallback;

      const saved = JSON.parse(raw) as Partial<FileXAppContext>;
      return saved[key] ?? fallback;
    } catch {
      return fallback;
    }
  }

  /**
   * Exposes FileXTabItem array signals
   */
  readonly tabs = signal<FileXTab[]>(this.restoreField('tabs', []));

  /**
   * Exposes currentActiveDirectory signal
   */
  readonly currentActiveDirectoryTab = signal<string | null>(
    this.restoreField('currentActiveDirectory', null),
  );
}
