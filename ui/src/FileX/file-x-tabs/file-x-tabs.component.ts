import { Component, computed, inject } from '@angular/core';
import { getElectronApi } from '../../utils';

@Component({
  selector: 'app-file-x-tabs',
  imports: [],
  templateUrl: './file-x-tabs.component.html',
  styleUrl: './file-x-tabs.component.css',
})
export class FileXTabsComponent {
  private readonly api = getElectronApi();

  /**
   * Change the active directory when a tab item is clicked
   * @param item The item clicked
   */
  changeActiveDirectory() {
  }

  /**
   * Removes the given tab item from the list of active tabs and moves it to the next one
   * @param item The item to remove
   * @param event Angular event
   */
  removeDirectoryTabItem(event: Event) {
    event.stopPropagation();

  }
}
