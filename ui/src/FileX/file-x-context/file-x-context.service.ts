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
    };
  }

  /**
   * Exposes FileXTabItem array signals
   */
  readonly tabs = signal<FileXTab[]>([]);
}
