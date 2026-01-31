import { Injectable } from '@angular/core';
import { KeyMaster } from 'umbr-key-master';

/**
 * Wraps `umbr-key-master` to expose it as a singleten
 */
@Injectable({
  providedIn: 'root',
})
export class HotKeyService {
  /**
   * Exposes get master
   */
  master = new KeyMaster();
}
