import { Component, computed, inject, signal, Signal } from '@angular/core';
import { FileXToolBarDirectoryPathViewerComponent } from '../file-x-tool-bar-directory-path-viewer/file-x-tool-bar-directory-path-viewer.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FileXSearchComponent } from '../file-x-search/file-x-search.component';
import { FileXContextService } from '../file-x-context/file-x-context.service';
import { FileXBackHistoryItem, FileXForwardHistoryItem } from '../types';
import { ChangeActiveDirectory } from '../utils';

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
}
