import { Component, computed, inject } from '@angular/core';
import { FileXContextService } from '../file-x-context/file-x-context.service';
import { FileXTab } from '../file-x-context/type';
import { getElectronApi } from '../../utils';

@Component({
  selector: 'app-file-x-tabs',
  imports: [],
  templateUrl: './file-x-tabs.component.html',
  styleUrl: './file-x-tabs.component.css',
})
export class FileXTabsComponent {
  private readonly ctx = inject(FileXContextService);
  private readonly api = getElectronApi();

  tabs = computed(() => this.ctx.tabs());
  activeDir = computed(() => this.ctx.currentActiveDirectory());

  /**
   * Change the active directory when a tab item is clicked
   * @param item The item clicked
   */
  changeActiveDirectory(item: FileXTab) {
    this.ctx.currentActiveDirectory.set(item.baseDirectoryPath);
  }

  /**
   * Removes the given tab item from the list of active tabs and moves it to the next one
   * @param item The item to remove
   * @param event Angular event
   */
  removeDirectoryTabItem(event: Event, item: FileXTab) {
    event.stopPropagation();

    let tabs = this.ctx.tabs();
    let filetredTabs = tabs.filter(
      (x) => x.baseDirectoryPath !== item.baseDirectoryPath,
    );

    if (filetredTabs.length > 0) {
      this.ctx.tabs.set(structuredClone(filetredTabs));

      let next = filetredTabs[0];
      this.ctx.currentActiveDirectory.set(next.baseDirectoryPath);
    } else {
      this.ctx.tabs.set([]);
      this.ctx.currentActiveDirectory.set(null);

      setTimeout(() => {
        this.api.chromeWindowApi.close();
      }, 10);
    }
  }
}
