import { DestroyRef, Injectable } from '@angular/core';
import { InMemoryAppContext, InMemoryAppContextCallback } from './type';

/**
 * Represents information that dosent need to be persisted between sessions but within the lifecycle of the app, i.e until a refresh
 * but has the same structure to notify those who want it it's data when it changes
 */
@Injectable({
  providedIn: 'root',
})
export class InMemoryContextService {
  /**
   * Specific field and all it's callbacks to run when said field changes
   */
  private readonly subs = new Map<
    keyof InMemoryAppContext,
    Set<InMemoryAppContextCallback>
  >();

  private readonly appContext: InMemoryAppContext = {
    currentActiveContextMenu: null,
    isCreateFileOrFolderActive: null,
    isEditorResize: null,
    refreshDirectory: null,
  };

  /**
   * Subscribe to a specific field and run custom logic when it changes
   * @param key The specific field to sub to
   * @param callback The callback to run
   * @param destroyRef The angular destroy ref to auto unsub on destroy
   * @returns {void} Nothing
   */
  autoSub(
    key: keyof InMemoryAppContext,
    callback: InMemoryAppContextCallback,
    destroyRef: DestroyRef
  ): void {
    let unsub = this.sub(key, callback);
    destroyRef.onDestroy(unsub);
  }

  /**
   * Subscribe to a specific field to and run custom logic
   * @param key The specific field to subscribe to
   * @param callback
   * @returns {voidCallback} A unsub function to remove the callback
   */
  sub(
    key: keyof InMemoryAppContext,
    callback: InMemoryAppContextCallback
  ): voidCallback {
    let set = this.subs.get(key);
    if (!set) {
      set = new Set<InMemoryAppContextCallback>();
      this.subs.set(key, set);
    }

    set.add(callback);

    return () => set.delete(callback);
  }

  /**
   * Update a specific field with a value of the correct type.
   * Automatically notifies subscribers for that field.
   */
  update<K extends keyof InMemoryAppContext>(
    key: K,
    value: InMemoryAppContext[K]
  ): void {
    this.appContext[key] = value;
    this.notify(key);
  }

  /**
   * Get a snap shot of the current app ctx
   * @returns {InMemoryAppContext}
   */
  getSnapShot(): InMemoryAppContext {
    return structuredClone(this.appContext);
  }

  /**
   * Run all callbacks for a specific
   * @param key The specific field being updated to notify
   */
  private async notify(key: keyof InMemoryAppContext) {
    let callbacks = Array.from(this.subs.get(key) ?? []);
    let snapShot = this.getSnapShot();

    for (let i = 0; i < callbacks.length; i++) {
      try {
        await callbacks[i](snapShot);
      } catch (error) {
        console.error('In memeory callback' + JSON.stringify(error));
      }
    }
  }
}
