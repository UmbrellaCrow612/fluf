import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ContextService } from '../app-context/app-context.service';
import { getElectronApi } from '../../utils';
import { CommonModule } from '@angular/common';
import { FileExplorerItemComponent } from './file-explorer-item/file-explorer-item.component';
import {
  collapseAllFileNodesToRoot,
  getParentNode,
  pushChildrenToNode,
} from './utils';

@Component({
  selector: 'app-file-explorer',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    CommonModule,
    FileExplorerItemComponent,
  ],
  templateUrl: './file-explorer.component.html',
  styleUrl: './file-explorer.component.css',
})
export class FileExplorerComponent implements OnInit {
  private readonly appContext = inject(ContextService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = getElectronApi();

  selectedDirectorPath: string | null = null;
  directoryFileNodes: fileNode[] | null = null;
  isExplorerActive = false;
  disableCreateFileOrFolder: boolean | null = null;

  ngOnInit(): void {
    let init = this.appContext.getSnapshot();

    // set inital state based on ctx
    this.selectedDirectorPath = init.selectedDirectoryFolderPath;
    this.directoryFileNodes = init.directoryFileNodes;
    this.isExplorerActive =
      init.fileExplorerActiveFileOrFolder?.path === this.selectedDirectorPath;
    this.disableCreateFileOrFolder = init.isCreateFileOrFolderActive;

    // Subscribe to changes update local state
    this.appContext.autoSub(
      'selectedDirectoryFolderPath',
      (ctx) => {
        this.selectedDirectorPath = ctx.selectedDirectoryFolderPath;
      },
      this.destroyRef
    );
    this.appContext.autoSub(
      'directoryFileNodes',
      (ctx) => {
        this.directoryFileNodes = ctx.directoryFileNodes;
      },
      this.destroyRef
    );
    this.appContext.autoSub(
      'fileExplorerActiveFileOrFolder',
      (ctx) => {
        this.isExplorerActive =
          ctx.fileExplorerActiveFileOrFolder?.path ===
          this.selectedDirectorPath;
      },
      this.destroyRef
    );
    this.appContext.autoSub(
      'isCreateFileOrFolderActive',
      (ctx) => {
        this.disableCreateFileOrFolder = ctx.isCreateFileOrFolderActive;
      },
      this.destroyRef
    );
    this.appContext.autoSub(
      'refreshDirectoryFolderNodes',
      async (ctx) => {
        if (ctx.refreshDirectoryFolderNodes) {
          await this.merge();
        }
      },
      this.destroyRef
    );
  }

  async openFolder() {
    let res = await this.api.selectFolder();
    if (res.canceled) {
      return;
    }

    this.appContext.update('selectedDirectoryFolderPath', res.filePaths[0]);

    await this.readDir();
  }

  /**
   * Reads selected folder path and sets file nodes globally
   */
  async readDir() {
    let nodes = await this.api.readDir(undefined, this.selectedDirectorPath!);

    this.appContext.update('directoryFileNodes', nodes);
  }

  /**
   * Runs when colapse folders is clicked will un expand all folder all the way to root
   */
  collapseFolders() {
    let ctx = this.appContext.getSnapshot();
    collapseAllFileNodesToRoot(ctx.directoryFileNodes!);
    this.appContext.update('fileExplorerActiveFileOrFolder', {
      children: [],
      expanded: false,
      isDirectory: true,
      path: this.selectedDirectorPath!,
      name: 'Root',
      mode: 'default',
    });
    this.appContext.update('directoryFileNodes', ctx.directoryFileNodes);
  }

  /**
   * Runs when refresh button clicked - re reads nodes and updates global state
   */
  async refreshClicked() {
    await this.readDir();
  }

  /**
   * Runs when the backdrop of the container is clicked
   */
  fileExplorerScrollContainerClicked(event: Event) {
    const target = event.target as HTMLElement;
    const container = event.currentTarget as HTMLElement;

    if (target === container) {
      /*Clicked empty space so set the file or folder focus in side bar to root node */
      this.appContext.update('fileExplorerActiveFileOrFolder', {
        children: [],
        expanded: false,
        isDirectory: true,
        path: this.selectedDirectorPath!,
        name: 'Root',
        mode: 'default',
      });
    }
  }

  /**
   * Runs when the file explorer empty space is doubled clicked making a call to create file logic
   */
  fileExplorerScrollContainerDoubleClicked(event: Event) {
    const target = event.target as HTMLElement;
    const container = event.currentTarget as HTMLElement;

    if (target === container) {
      this.createFileOrFolder("createFile");
    }
  }

  createFileOrFolder(mode: fileNodeMode) {
    const ctx = this.appContext.getSnapshot();

    const nodes = ctx.directoryFileNodes!;
    const activeNode = ctx.fileExplorerActiveFileOrFolder;

    if (!activeNode) {
      console.log('No file or folder in focus');
      return;
    }

    const isRootActive = activeNode.path === this.selectedDirectorPath;

    // Construct the new file node
    const newFileNode: fileNode = {
      children: [],
      expanded: false,
      isDirectory: false,
      name: 'Editor',
      path: activeNode.path,
      mode: mode,
    };

    if (isRootActive) {
      // Root node is not part of `nodes`, so push directly
      nodes.push(newFileNode);
    } else if (activeNode.isDirectory) {
      // Push under the active directory
      pushChildrenToNode(nodes, activeNode.path, [newFileNode]);
    } else {
      // Active node is a file — find its parent
      const parent = getParentNode(nodes, activeNode.path);
      if (parent) {
        pushChildrenToNode(nodes, parent.path, [newFileNode]);
      } else {
        console.warn('Parent not found for active file node.');
      }
    }

    this.appContext.update('isCreateFileOrFolderActive', true);
    this.appContext.update('directoryFileNodes', nodes);
  }

  /**
   * Merges and synchronizes the current directory structure with the filesystem.
   * - Adds new nodes
   * - Updates existing ones
   * - Removes stale nodes that no longer exist
   */
  private async merge() {
    let newNodes = await this.api.readDir(
      undefined,
      this.selectedDirectorPath!
    );
    let updatedNodes = await this.mergeNodes(
      this.directoryFileNodes!,
      newNodes
    );
    this.appContext.update('directoryFileNodes', updatedNodes);
  }

  /**
   * Recursively merges new nodes into old nodes, fetching children when necessary.
   */
  private async mergeNodes(
    oldNodes: fileNode[],
    newNodes: fileNode[]
  ): Promise<fileNode[]> {
    const merged: fileNode[] = [];

    for (const newNode of newNodes) {
      const existing = oldNodes.find((n) => n.path === newNode.path);

      if (!existing) {
        const nodeToAdd: fileNode = { ...newNode };
        merged.push(nodeToAdd);
      } else {
        existing.name = newNode.name;

        if (existing.isDirectory && existing.expanded) {
          const newChildren = await this.api.readDir(undefined, existing.path);
          existing.children = await this.mergeNodes(
            existing.children || [],
            newChildren
          );
        } else {
          existing.children = [];
        }

        merged.push(existing);
      }
    }

    const filtered = merged.filter((m) =>
      newNodes.some((n) => n.path === m.path)
    );

    return filtered;
  }
}
