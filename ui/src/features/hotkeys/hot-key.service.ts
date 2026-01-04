import { inject, Injectable } from '@angular/core';
import { ContextService } from '../app-context/app-context.service';
import { KeyMaster, GetDataCallback } from 'umbr-key-master';

/**
 * Wraps `umbr-key-master` to expose it as a singleten
 */
@Injectable({
  providedIn: 'root',
})
export class HotKeyService {
  private readonly appContext = inject(ContextService);
  private getAppContext: GetDataCallback = () => {
    return this.appContext.getSnapShot();
  };

  /**
   * Exposes get master
   */
  master = new KeyMaster(this.getAppContext);
}
