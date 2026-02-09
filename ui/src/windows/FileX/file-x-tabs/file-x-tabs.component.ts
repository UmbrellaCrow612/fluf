import { Component, computed, inject, Signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FileXContextService } from '../file-x-context/file-x-context.service';
import { FileXTab } from '../types';
import { filexRemoveTabItem, filexSetTabItemAsActive } from '../utils';
import { ApplicationContextMenuService } from '../../../app/context-menu/application-context-menu.service';
import { FileXTabItemContextMenuComponent } from '../file-x-tab-item-context-menu/file-x-tab-item-context-menu.component';
import { getElectronApi } from '../../../utils';
import { FileXInMemoryContextService } from '../file-x-context/file-x-in-memory-context.service';

@Component({
  selector: 'app-file-x-tabs',
  imports: [MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './file-x-tabs.component.html',
  styleUrl: './file-x-tabs.component.css',
})
export class FileXTabsComponent {
  private readonly fileXContextService = inject(FileXContextService);
  private readonly fileXInMemoryContextService = inject(FileXInMemoryContextService)
  private readonly applicationContextMenuService = inject(
    ApplicationContextMenuService,
  );
  private readonly api = getElectronApi()

  /** Keeps local ref to the tabs - */
  tabs: Signal<FileXTab[]> = computed(() => this.fileXContextService.tabs());

  /** Keeps track of the active tab by it's ID */
  selectedTabId: Signal<string> = computed(() =>
    this.fileXContextService.activeTabId(),
  );

  /** Removes a tab item  */
  removeTab(event: Event, item: FileXTab) {
    event.stopPropagation();

    filexRemoveTabItem(item, this.fileXContextService, this.fileXInMemoryContextService)
  }

  /** Changes the active tab and directory to the given item  */
  selectedTab(item: FileXTab) {
    filexSetTabItemAsActive(item, this.fileXContextService);
  }

  /** Adds a new tab item - defaults to home directory and makes it active */
  async addNewTab() {
    let tabs = this.tabs();

    let root = await this.api.pathApi.getRootPath() + "\\dev" // make it cross platform 
    const asNode = await this.api.fsApi.getNode(root)

    let newTabItem: FileXTab = {
      directory: asNode.path,
      name: asNode.name,
      id: crypto.randomUUID(),
    };

    tabs.push(newTabItem);

    this.fileXContextService.tabs.set(structuredClone(tabs)); // need diff ref

    filexSetTabItemAsActive(newTabItem, this.fileXContextService);
  }

  /**
   * Display a context menu for a given tab item
   * @param event The event
   * @param item The tab item clicked
   */
  displayContextMenuForTabItem(event: MouseEvent, item: FileXTab) {
    this.applicationContextMenuService.open(
      FileXTabItemContextMenuComponent,
      {
        mouseX: event.clientX,
        mouseY: event.clientY,
      },
      item,
    );
  }
}
