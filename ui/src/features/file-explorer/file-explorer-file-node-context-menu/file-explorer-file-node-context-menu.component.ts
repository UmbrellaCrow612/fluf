import { Component, inject } from '@angular/core';
import { InMemoryContextService } from '../../app-context/app-in-memory-context.service';
import {
  ContextMenuItem,
  ContextMenuItemComponent,
} from '../../context-menu/context-menu-item/context-menu-item.component';
import { getParentNode, pushChildrenToNode } from '../utils';
import { ContextService } from '../../app-context/app-context.service';

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
        this.createNewFileOrFolder('createFile');
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

  createNewFileOrFolder(mode: fileNodeMode) {
    let ctx = this.appContext.getSnapshot();

    let fileNode = this.snapshot.currentActiveContextMenu?.data as fileNode;
    let nodePath = fileNode.path;

    const nodes = ctx.directoryFileNodes ?? [];

    if (!fileNode.isDirectory) {
      nodePath = fileNode.parentPath;
    }

    let newNode: fileNode = {
      children: [],
      expanded: false,
      isDirectory: false,
      mode: mode,
      name: 'Editor',
      parentPath: fileNode.parentPath,
      path: nodePath,
    };

    if (fileNode.isDirectory) {
      // Push under the directory
      pushChildrenToNode(nodes, fileNode.path, [newNode]);
    } else {
      // Node is a file — find its parent
      const parent = getParentNode(nodes, fileNode.path);
      if (parent) {
        pushChildrenToNode(nodes, parent.path, [newNode]);
      } else {
        // we are in root
        nodes.push(newNode);
      }
    }

    this.inMemoryContextService.update('isCreateFileOrFolderActive', true);
    this.inMemoryContextService.update('currentActiveContextMenu', null);
    this.appContext.update('directoryFileNodes', nodes);
  }
}
