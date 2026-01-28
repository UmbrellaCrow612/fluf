import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  Signal,
} from '@angular/core';
import { FileXTab } from '../types';
import { FileXContextService } from '../file-x-context/file-x-context.service';
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
  
  /**
   * Holds the tabs from file x
   */
  tabs: Signal<FileXTab[]> = computed(() => this.ctx.tabs());

  /**
   * Change the active directory when a tab item is clicked
   * @param item The item clicked
   */
  changeActiveDirectory() {}

  /**
   * Removes the given tab item from the list of active tabs and moves it to the next one
   * @param item The item to remove
   * @param event Angular event
   */
  removeDirectoryTabItem(event: Event, item: FileXTab) {
    event.stopPropagation();

    let filteredTabs = this.tabs().filter(
      (x) => x.directory !== item.directory,
    );
    
    if (filteredTabs.length > 0) {
      let next = filteredTabs[0];
      this.ctx.activeDirectory.set(next.directory);
      this.ctx.tabs.set([...filteredTabs]);
    } else {
      this.ctx.tabs.set([]);
      this.ctx.activeDirectory.set('');

      setTimeout(() => {
        this.api.chromeWindowApi.close();
      }, 100);
    }
  }
}