import { Injectable } from '@angular/core';
import { AppContext, ContextService } from './app-context.service';

type HotKeyCallback = (context: AppContext) => void;

interface HotKeySubscription {
  keys: string[];
  callback: HotKeyCallback;
  contextFilter?: (context: AppContext) => boolean; // optional filter
}

@Injectable({
  providedIn: 'root',
})
export class HotKeyService {
  private pressedKeys = new Set<string>();
  private subscriptions: HotKeySubscription[] = [];

  constructor(private contextService: ContextService) {
    document.addEventListener('keydown', (event) => this.handleKeyDown(event));
    document.addEventListener('keyup', (event) => this.handleKeyUp(event));
  }

  private normalizeKey(key: string) {
    return key.toLowerCase();
  }

  handleKeyDown(event: KeyboardEvent) {
    this.pressedKeys.add(this.normalizeKey(event.key));
    this.checkSubscriptions();
  }

  handleKeyUp(event: KeyboardEvent) {
    this.pressedKeys.delete(this.normalizeKey(event.key));
  }

  subscribe(
    keys: string[],
    callback: HotKeyCallback,
    contextFilter?: (context: AppContext) => boolean
  ) {
    this.subscriptions.push({
      keys: keys.map(this.normalizeKey),
      callback,
      contextFilter,
    });
  }

  unsubscribe(keys: string[], callback: HotKeyCallback) {
    this.subscriptions = this.subscriptions.filter(
      (sub) =>
        !(
          this.arraysEqual(sub.keys, keys.map(this.normalizeKey)) &&
          sub.callback === callback
        )
    );
  }

  private checkSubscriptions() {
    const context = this.contextService.getContext();
    for (const sub of this.subscriptions) {
      if (
        sub.keys.every((key) => this.pressedKeys.has(key)) &&
        (!sub.contextFilter || sub.contextFilter(context))
      ) {
        sub.callback(context);
      }
    }
  }

  private arraysEqual(arr1: string[], arr2: string[]) {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((val) => arr2.includes(val));
  }
}
