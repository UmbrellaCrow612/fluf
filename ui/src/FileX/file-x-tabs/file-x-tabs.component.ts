import { Component, computed, inject, Signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FileXContextService } from '../file-x-context/file-x-context.service';
import { FileXTab } from '../types';
import { getElectronApi } from '../../utils';

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

  /** Keeps track of the active directory */
  selectedDirectoryPath: Signal<string> = computed(() =>
    this.fileXContextService.activeDirectory(),
  );

  /** Removes a tab item  */
  removeTab(event: Event, item: FileXTab) {
    event.stopPropagation();

    let tabs = this.tabs();
    let filteredTabs = tabs.filter((x) => x.id !== item.id);

    if (filteredTabs.length > 0) {
      let next = filteredTabs[0];

      this.fileXContextService.activeDirectory.set(next.directory);
      this.fileXContextService.tabs.set(filteredTabs);
    } else {
      this.fileXContextService.activeDirectory.set('');
      this.fileXContextService.tabs.set([]);

      setTimeout(() => {
        this.api.chromeWindowApi.close();
      }, 10);
    }
  }

  /** Changes the active tab and directory to the given item  */
  selectedTab(item: FileXTab) {
    this.fileXContextService.activeDirectory.set(item.directory);
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
    this.fileXContextService.activeDirectory.set(newTabItem.directory);
  }
}
