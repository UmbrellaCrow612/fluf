import { inject, Injectable, DestroyRef } from '@angular/core';
import { AppContext, ContextService } from '../app-context/app-context.service';
import { WinKey } from './win-key';

/**
 * Represents a hot key
 */
export interface HotKey {
  /**
   * Keys that will be listened to i.e ["Control", "p"]
   */
  keys: WinKey[];

  /**
   * A callback function to run when the keys are pressed
   * @param ctx The application context at the time of running it
   */
  callback: (ctx: AppContext) => void;
}

@Injectable({
  providedIn: 'root',
})
export class HotKeyService {
  /**
   * List of keys pressed
   */
  private _keys: Set<string> = new Set();

  /**
   * List of subscriptions
   */
  private _subs: Set<HotKey> = new Set();

  /**
   * App context
   */
  private readonly _context = inject(ContextService);

  constructor() {
    document.addEventListener('keydown', (event) => this.handleKeyDown(event));
    document.addEventListener('keyup', (event) => this.handleKeyUp(event));
  }

  /**
   * Subscribe a hot key and return an unsubscribe function.
   * @param sub The hot key to register
   * @returns Function to unsubscribe the hot key
   */
  sub(sub: HotKey): () => void {
    this._subs.add(sub);
    return () => this._subs.delete(sub);
  }

  /**
   * Automatically subscribe and unsubscribe when the given destroy ref is triggered.
   * @param sub The hot key to register
   * @param destroyRef The Angular DestroyRef (from inject(DestroyRef))
   */
  autoSub(sub: HotKey, destroyRef: DestroyRef): void {
    const unsub = this.sub(sub);
    destroyRef.onDestroy(unsub);
  }

  /**
   * Remove a hot key subscription manually
   * @param sub The hot key to remove
   */
  unsub(sub: HotKey): void {
    this._subs.delete(sub);
  }

  /**
   * Runs when a keydown event occurs
   */
  private handleKeyDown(event: KeyboardEvent): void {
    this._keys.add(event.key);
    this.runSubs();
  }

  /**
   * Runs when a keyup event occurs
   */
  private handleKeyUp(event: KeyboardEvent): void {
    this._keys.delete(event.key);
  }

  /**
   * Run all hot keys registered
   */
  private runSubs(): void {
    const ctx = this._context.getSnapshot();
    for (const item of this._subs) {
      if (this.arrayMatchesSet(item.keys, this._keys)) {
        item.callback(ctx);
      }
    }
  }

  /**
   * Check if an item's keys match the current keys being pressed
   */
  private arrayMatchesSet(arr: string[], set: Set<string>): boolean {
    if (arr.length !== set.size) return false;
    return arr.every((key) => set.has(key));
  }
}
