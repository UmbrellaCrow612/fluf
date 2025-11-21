import { Component, inject } from '@angular/core';
import { InMemoryContextService } from '../../app-context/app-in-memory-context.service';
import { ContextMenuItem, ContextMenuItemComponent } from '../../context-menu/context-menu-item/context-menu-item.component';

@Component({
  selector: 'app-file-explorer-file-node-context-menu',
  imports: [ContextMenuItemComponent],
  templateUrl: './file-explorer-file-node-context-menu.component.html',
  styleUrl: './file-explorer-file-node-context-menu.component.css',
})
export class FileExplorerFileNodeContextMenuComponent {
  private readonly inMemoryContextService = inject(InMemoryContextService);
  private readonly snapshot = this.inMemoryContextService.getSnapShot();

  /**
   * All the items to add to the menu
   */
  items: ContextMenuItem[] = [{
    label: "New file",
    clicked: () => {
      this.inMemoryContextService.update("isCreateFileOrFolderActive", true)
      this.inMemoryContextService.update("currentActiveContextMenu", null)
      console.log(JSON.stringify(this.snapshot.currentActiveContextMenu?.data))
    },
    disabled: false,
    icon: undefined,
    keybinding: undefined
  }];
}
