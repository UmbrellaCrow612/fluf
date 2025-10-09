import { inject, Injectable } from '@angular/core';
import { AppContext, ContextService } from './app-context.service';
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
   * A callback function to run when the keys are ran
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
   * Subscribe a hot key to be run when the condition is met
   * @param sub The hot key to register
   */
  sub(sub: HotKey) {
    this._subs.add(sub);
  }

  /**
   * Remove a hot key subscription
   * @param sub The hot key to remove
   */
  unsub(sub: HotKey) {
    this._subs.delete(sub);
  }

  /**
   * Runs when a keydown event is run
   * @param event - Keyboard event
   */
  private handleKeyDown(event: KeyboardEvent) {
    this._keys.add(event.key);
    this.runSubs();
  }

  /**
   * Runs when keyup event is run
   * @param event - Keyboard event
   */
  private handleKeyUp(event: KeyboardEvent) {
    this._keys.delete(event.key);
  }

  /**
   * Run all hot keys registered
   */
  private runSubs() {
    let ctx = this._context.getContext();
    for (let item of this._subs) {
      if (this.arrayMatchesSet(item.keys, this._keys)) {
        item.callback(ctx);
      }
    }
  }

  /**
   * Check if an item's keys match the current keys being pressed
   * @param arr The keys of a hot key for example ["Control", "p"]
   * @param set The tracked keys are pressed
   * @returns {boolean} If the item's keys match the current pressed keys
   */
  private arrayMatchesSet(arr: string[], set: Set<string>) {
    if (arr.length !== set.size) return false;

    return arr.every((key) => set.has(key));
  }
}
