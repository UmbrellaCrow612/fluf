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

@Component({
  selector: 'app-file-x-tabs',
  imports: [],
  templateUrl: './file-x-tabs.component.html',
  styleUrl: './file-x-tabs.component.css',
})
export class FileXTabsComponent {
  private readonly ctx = inject(FileXContextService);
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
  removeDirectoryTabItem(event: Event) {
    event.stopPropagation();
  }
}
