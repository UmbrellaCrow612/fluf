import { Component, inject } from '@angular/core';
import { InMemoryContextService } from '../../app-context/app-in-memory-context.service';
import {
  ContextMenuItem,
  ContextMenuItemComponent,
} from '../../context-menu/context-menu-item/context-menu-item.component';
import { ContextService } from '../../app-context/app-context.service';
import { addFileOrFolderNode } from '../work-tree';

@Component({
  selector: 'app-file-explorer-file-node-context-menu',
  imports: [ContextMenuItemComponent],
  templateUrl: './file-explorer-file-node-context-menu.component.html',
  styleUrl: './file-explorer-file-node-context-menu.component.css',
})
export class FileExplorerFileNodeContextMenuComponent {
  private readonly inMemoryContextService = inject(InMemoryContextService);
  private readonly appContext = inject(ContextService);
  private readonly snapshot = this.inMemoryContextService.getSnapShot();

  /**
   * All the items to add to the menu
   */
  items: ContextMenuItem[] = [
    {
      label: 'New file',
      clicked: () => {
        let nodes = this.appContext.getSnapshot().directoryFileNodes ?? [];
        addFileOrFolderNode(
          this.snapshot.currentActiveContextMenu?.data as fileNode,
          'createFile',
          nodes
        );
        this.appContext.update('directoryFileNodes', nodes);
        this.inMemoryContextService.update('isCreateFileOrFolderActive', true);
        this.inMemoryContextService.update('currentActiveContextMenu', null);
      },
      disabled: () => {
        return (
          this.snapshot.isCreateFileOrFolderActive != null &&
          this.snapshot.isCreateFileOrFolderActive
        );
      },
      icon: undefined,
      keybinding: undefined,
    },

    {
      label: 'New folder',
      clicked: () => {
        let nodes = this.appContext.getSnapshot().directoryFileNodes ?? [];
        addFileOrFolderNode(
          this.snapshot.currentActiveContextMenu?.data as fileNode,
          'createFolder',
          nodes
        );
        this.appContext.update('directoryFileNodes', nodes);
        this.inMemoryContextService.update('isCreateFileOrFolderActive', true);
        this.inMemoryContextService.update('currentActiveContextMenu', null);
      },
      disabled: () => {
        return (
          this.snapshot.isCreateFileOrFolderActive != null &&
          this.snapshot.isCreateFileOrFolderActive
        );
      },
      icon: undefined,
      keybinding: undefined,
    },
  ];
}
