import { Component, computed, inject, Signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FileXContextService } from '../file-x-context/file-x-context.service';
import { FileXTab } from '../types';
import { getElectronApi } from '../../utils';
import { filexResetState, filexSetTabItemAsActive } from '../utils';

@Component({
  selector: 'app-file-x-tabs',
  imports: [MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './file-x-tabs.component.html',
  styleUrl: './file-x-tabs.component.css',
})
export class FileXTabsComponent {
  private readonly fileXContextService = inject(FileXContextService);
  private readonly api = getElectronApi();

  /** Keeps local ref to the tabs - */
  tabs: Signal<FileXTab[]> = computed(() => this.fileXContextService.tabs());

  /** Keeps track of the active tab by it's ID */
  selectedTabId: Signal<string> = computed(() =>
    this.fileXContextService.activeTabId(),
  );

  /** Removes a tab item  */
  removeTab(event: Event, item: FileXTab) {
    event.stopPropagation();

    let filteredTabs = this.tabs().filter((x) => x.id !== item.id);

    if (filteredTabs.length > 0) {
      let next = filteredTabs[0];

      filexSetTabItemAsActive(next, this.fileXContextService);
      this.fileXContextService.tabs.set(structuredClone(filteredTabs)); // need a diff ref
    } else {
      filexResetState(this.fileXContextService);

      setTimeout(() => {
        this.api.chromeWindowApi.close();
      }, 10);
    }
  }

  /** Changes the active tab and directory to the given item  */
  selectedTab(item: FileXTab) {
    filexSetTabItemAsActive(item, this.fileXContextService);
  }

  /** Adds a new tab item - defaults to home directory and makes it active */
  addNewTab() {
    let tabs = this.tabs();

    let newTabItem: FileXTab = {
      directory: 'home',
      name: 'Home',
      id: crypto.randomUUID(),
    };

    tabs.push(newTabItem);

    this.fileXContextService.tabs.set(structuredClone(tabs)); // need diff ref

    filexSetTabItemAsActive(newTabItem, this.fileXContextService);
  }
}
