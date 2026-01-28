import { effect, Injectable, signal, untracked } from '@angular/core';
import { FileXStoreData, FileXTab } from '../types';
import { getElectronApi } from '../../utils';
import { FILE_X_STORE_DATA } from '../store-key-constants';

/**
 * Stores the file x context in a central place and offers a signal based API
 */
@Injectable({
  providedIn: 'root',
})
export class FileXContextService {
  private readonly api = getElectronApi();
  private isUpdatingFromStore = false;

  constructor() {
    this.init();
    this.setupPersistence();
  }

  /** Hydrates the signals we expose */
  private async init() {
    console.log('File x hydration ran');
    try {
      let data = await this.api.storeApi.get(FILE_X_STORE_DATA);
      if (!data) {
        console.error('No data exists for service to hydrate');
        return;
      }

      let parsed: FileXStoreData = JSON.parse(data);
      this.tabs.set(parsed.tabs);

      // Listen for external changes to the store
      this.api.storeApi.onChange(FILE_X_STORE_DATA, (newData) => {
        if (this.isUpdatingFromStore) return; // Skip if we just wrote to store

        try {
          const parsed: FileXStoreData = JSON.parse(newData);
          this.isUpdatingFromStore = true;
          this.tabs.set(parsed.tabs);
        } catch (error) {
          console.error('Failed to parse store update', error);
        } finally {
          this.isUpdatingFromStore = false;
        }
      });
    } catch (error) {
      console.error('Failed to load file x session data', error);
      throw error;
    }
  }

  /** Whenever a field changes we store it */
  private setupPersistence() {
    effect(() => {
      if (this.isUpdatingFromStore) return;

      console.log('persisted file x session data');
      const currentTabs = this.tabs();

      const dataToSave: FileXStoreData = {
        tabs: currentTabs,
      };

      this.api.storeApi.set(FILE_X_STORE_DATA, JSON.stringify(dataToSave));
    });
  }

  readonly tabs = signal<FileXTab[]>([]);
}
