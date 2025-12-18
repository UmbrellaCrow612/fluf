import { DestroyRef, effect, Injectable, signal } from '@angular/core';
import { AppContext, AppContextCallback } from './type';
import { voidCallback } from '../../gen/type';

const LOCAL_STORAGE_KEY = 'app-context';

/**
 * Service that provides access to application context, persists it,
 * and allows subscribing to changes.
 */
@Injectable({
  providedIn: 'root',
})
export class ContextService {
  private _ctx: AppContext = {
    sideBarActiveElement: null,
    selectedDirectoryPath: null,
    directoryFileNodes: null,
    fileExplorerActiveFileOrFolder: null,
    openFiles: null,
    currentOpenFileInEditor: null,
    displayFileEditorBottom: null,
    fileEditorBottomActiveElement: null,
    shells: null,
    currentActiveShellId: null,
    editorMainActiveElement: null,
  };

  private subscriptions = new Map<keyof AppContext, Set<AppContextCallback>>();

  constructor() {
    this.restoreState(); // TODO REMOE AT THE END

    // ============= refactored =-====

    // effect(() => {
    //   console.log('Persisted state ');
    //   this.persist();
    // });
  }

  /**
   * Restore persisted context from localStorage
   */
  private restoreState() {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return;

      const saved = JSON.parse(raw) as Partial<AppContext>;
      this._ctx = { ...this._ctx, ...saved };
      console.log('[ContextService] Restored state from localStorage');
    } catch (err) {
      console.warn('[ContextService] Failed to restore context', err);
    }
  }

  /**
   * Persist the current context state to localStorage
   */
  private saveState() {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this._ctx));
    } catch (err) {
      console.warn('[ContextService] Failed to save context', err);
    }
  }

  /**
   * Subscribe to changes for a specific AppContext field
   */
  sub<K extends keyof AppContext>(
    key: K,
    callback: AppContextCallback
  ): voidCallback {
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }

    const set = this.subscriptions.get(key)!;
    set.add(callback);

    return () => set.delete(callback);
  }

  /**
   * Subscribe and automatically unsubscribe when the provided DestroyRef is destroyed
   */
  autoSub<K extends keyof AppContext>(
    key: K,
    callback: AppContextCallback,
    destroyRef: DestroyRef
  ): void {
    const unsubscribe = this.sub(key, callback);
    destroyRef.onDestroy(unsubscribe);
  }

  /**
   * Update part of the application context and notify subscribers
   */
  async update<K extends keyof AppContext>(key: K, value: AppContext[K]) {
    this._ctx[key] = value;
    this.saveState();
    await this.notify(key);
  }

  /**
   * Notify all subscribers for a specific AppContext field
   */
  private async notify<K extends keyof AppContext>(key: K) {
    const callbacks = this.subscriptions.get(key);
    if (!callbacks || callbacks.size === 0) return;

    const ctx = this.getSnapshot();

    // Run all callbacks concurrently, safely catch errors
    const promises = Array.from(callbacks).map(async (callback) => {
      try {
        await callback(ctx);
      } catch (err) {
        console.warn(
          `[ContextService] Error in callback for "${String(key)}":`,
          err
        );
      }
    });

    // Wait for all async callbacks to complete (optional)
    await Promise.all(promises);
  }

  getSnapshot(): AppContext {
    return structuredClone(this._ctx);
  }

  // ==================================== Refactored =======================================
  // I will write the signal api below one by one then once it's done delete the above

  // for now persistncae wont work for new fields we add we will need to fix the below tand remove the old way of doing it

  /**
   * Reads the signals and then saves them
   */
  private persist() {
    const snapshot: Partial<AppContext> = {
      sideBarActiveElement: this.sideBarActiveElement(),
      // TODO add more as you migrate
    };

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(snapshot));
    } catch (err) {
      console.warn('[ContextService] Failed to persist context', err);
    }
  }

  /**
   * Restore the state of a given field
   * @param key The specific field to restore
   * @param fallback A fallback value if it's invalid
   * @returns Value
   */
  private restoreField<K extends keyof AppContext>(
    key: K,
    fallback: AppContext[K]
  ): AppContext[K] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return fallback;

      const saved = JSON.parse(raw) as Partial<AppContext>;
      return saved[key] ?? fallback;
    } catch {
      return fallback;
    }
  }

  /**
   * Exposes sideBarActiveElement signal
   */
  readonly sideBarActiveElement = signal<AppContext['sideBarActiveElement']>(
    this.restoreField('sideBarActiveElement', null)
  );

  /**
   * Exposes directoryFileNodes signal
   */
  readonly directoryFileNodes = signal<AppContext['directoryFileNodes']>(
    this.restoreField('directoryFileNodes', null)
  );

  /**
   * Exposes selectedDirectoryPath signal
   */
  readonly selectedDirectoryPath = signal<AppContext['selectedDirectoryPath']>(
    this.restoreField('selectedDirectoryPath', null)
  );
}
