import {
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
  Signal,
} from '@angular/core';
import { FileXToolBarDirectoryPathViewerComponent } from '../file-x-tool-bar-directory-path-viewer/file-x-tool-bar-directory-path-viewer.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FileXSearchComponent } from '../file-x-search/file-x-search.component';
import { FileXContextService } from '../file-x-context/file-x-context.service';
import { FileXBackHistoryItem, FileXForwardHistoryItem } from '../types';
import { ChangeActiveDirectory } from '../utils';
import { getElectronApi } from '../../../utils';

@Component({
  selector: 'app-file-x-tool-bar',
  imports: [
    FileXToolBarDirectoryPathViewerComponent,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    FileXSearchComponent,
  ],
  templateUrl: './file-x-tool-bar.component.html',
  styleUrl: './file-x-tool-bar.component.css',
})
export class FileXToolBarComponent {
  private readonly fileXContextService = inject(FileXContextService);
  private readonly api = getElectronApi();

  constructor() {
    /**
     * Runs each time active dir changes and compouted if it can go up to the parent directory if it exists or is no longer root
     */
    effect(async () => {
      console.log('FileXToolBarComponent effect ran');
      let activeDir = this.fileXContextService.activeDirectory(); // by reading this we re trigger this each time it changes
      const asNode = await this.api.fsApi.getNode(activeDir);
      if (this.isRootPath(asNode.path)) {
        this.shouldCanGoUpADirecoryBeDisabled.set(true);
      } else {
        this.shouldCanGoUpADirecoryBeDisabled.set(false);
      }
    });
  }

  /**
   * Checks if the provided path is `just` a root path
   */
  private isRootPath(path: string): boolean {
    if (!path || path.length === 0) return false;

    // Normalize trailing slash(es)
    const normalized = path.replace(/[/\\]+$/, '');

    // --- WINDOWS ---
    // Check for root like "C:"
    if (/^[a-zA-Z]:$/.test(normalized)) {
      return true;
    }

    // Check for exactly one level below root:  C:\something
    if (/^[a-zA-Z]:[\\/][^\\/]+$/.test(normalized)) {
      return true;
    }

    // --- UNIX ---
    // "/" only → root
    if (normalized === '/') {
      return true;
    }

    // "/something" → exactly one level below root
    if (/^\/[^\/]+$/.test(normalized)) {
      return true;
    }

    return false;
  }

  /**
   * Dictated by UI side by reading the current active dir and computing if it can go up from there if it can i.e has a parent directory then this
   * is changed to allow it else not
   */
  shouldCanGoUpADirecoryBeDisabled = signal(false);

  /**
   * Keeps track of the back history items
   */
  private backHistoryItems: Signal<FileXBackHistoryItem[]> = computed(() =>
    this.fileXContextService.backHistoryItems(),
  );

  /**
   * Keeps track of forward history items
   */
  private forwardHistoryItems: Signal<FileXForwardHistoryItem[]> = computed(
    () => this.fileXContextService.forwardHistoryItems(),
  );

  /**
   * Keeps track of the current tab being shown
   */
  private readonly activeTabId: Signal<string> = computed(() =>
    this.fileXContextService.activeTabId(),
  );

  /**
   * Keeps track of it there is any back history and if there is then allow the user to go back in history else don't for the given tab
   */
  shouldBackHistoryBeDisabled: Signal<boolean> = computed(() => {
    const historyEntry = this.backHistoryItems().find(
      (x) => x.tabId === this.activeTabId(),
    );

    // No history entry → disabled
    if (!historyEntry) return true;

    // History exists but empty → disabled
    return historyEntry.history.length === 0;
  });

  /**
   * Keeps track of if there is forward history for the given tab and if there is allow the user to go forward in history
   */
  shouldForwardHistoryBeDisabled: Signal<boolean> = computed(() => {
    const historyEntry = this.forwardHistoryItems().find(
      (x) => x.tabId === this.activeTabId(),
    );

    // No history entry → disabled
    if (!historyEntry) return true;

    // History exists but empty → disabled
    return historyEntry.history.length === 0;
  });

  /**
   * Trys to go back in history for the current active tab
   */
  goBackInHistory() {
    const items = this.backHistoryItems();
    const entry = items.find((x) => x.tabId == this.activeTabId());

    if (!entry || entry.history.length == 0) {
      throw new Error(
        'Should not run this if there isnt any history disable the button',
      );
    }

    let lastDirectory = entry.history.pop();
    if (!lastDirectory) {
      throw new Error('No history');
    }

    this.fileXContextService.backHistoryItems.set(structuredClone(items)); // we use structuredClone so we give a diffrent refrence so change it propagated in signals

    ChangeActiveDirectory(lastDirectory, this.fileXContextService, {
      addToBackHistory: false,
      addToForwardHIstory: true,
    });
  }

  /**
   * Try to go forward in history i.e the folder you went back from
   */
  goForwardInHistory() {
    const items = this.forwardHistoryItems();
    const entry = items.find((x) => x.tabId == this.activeTabId());

    if (!entry || entry.history.length == 0) {
      throw new Error(
        'Should not run this if there isnt any history disable the button',
      );
    }

    let lastDirectory = entry.history.pop();
    if (!lastDirectory) {
      throw new Error('No history');
    }

    this.fileXContextService.forwardHistoryItems.set(structuredClone(items)); // we use structuredClone so we give a diffrent refrence so change it propagated in signals

    ChangeActiveDirectory(lastDirectory, this.fileXContextService, {
      addToBackHistory: true,
      addToForwardHIstory: false,
    });
  }

  /**
   * If the user can go up a directory to it's parent then it will
   */
  async goUpToParentDirectory() {
    if (this.shouldCanGoUpADirecoryBeDisabled()) {
      throw new Error('Cannot go up');
    }

    const activeDir = this.fileXContextService.activeDirectory();
    const asNode = await this.api.fsApi.getNode(activeDir);
    if (!asNode.isDirectory) {
      throw new Error('Provided path is not a directory');
    }

    ChangeActiveDirectory(asNode.parentPath, this.fileXContextService);
  }
}
