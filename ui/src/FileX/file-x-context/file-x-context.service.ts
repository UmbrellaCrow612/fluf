import { effect, Injectable, signal } from '@angular/core';
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
  private isUpdatingFromStore = false; // Prevent circular updates
  private isInitialized = false; // Track initialization state

  constructor() {
    this.setupPersistence();
    this.init();
  }

  /** Hydrates the signals we expose */
  private async init() {
    console.log('File x hydration ran');
    try {
      let data = await this.api.storeApi.get(FILE_X_STORE_DATA);
      if (!data) {
        console.error('No data exists for service to hydrate');
        this.isInitialized = true; 
        return;
      }

      let parsed: FileXStoreData = JSON.parse(data);
      this.tabs.set(parsed.tabs);

      this.api.storeApi.onChange(FILE_X_STORE_DATA, (newData) => {
        if (this.isUpdatingFromStore) return;
        
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

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to load file x session data', error);
      this.isInitialized = true;
      throw error;
    }
  }

  /** Whenever a field changes we store it */
  private setupPersistence() {
    effect(() => {
      if (this.isUpdatingFromStore || !this.isInitialized) return;
      
      console.log('persisted file x session data');

      const dataToSave: FileXStoreData = {
        tabs: this.tabs(),
      };

      this.api.storeApi.set(FILE_X_STORE_DATA, JSON.stringify(dataToSave));
    });
  }

  readonly tabs = signal<FileXTab[]>([]);
}