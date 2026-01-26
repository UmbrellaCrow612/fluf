import {
  Component,
  computed,
  effect,
  inject,
  OnInit,
  Signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EditorContextService } from '../app-context/editor-context.service';
import { getElectronApi } from '../../utils';

import { FileExplorerItemComponent } from './file-explorer-item/file-explorer-item.component';
import { InMemoryContextService } from '../app-context/editor-in-memory-context.service';
import { fileNode, fileNodeMode } from '../../gen/type';
import { collapseNodes, getNodeParent, pushNodeIntoChildren } from './fileNode';

@Component({
  selector: 'app-file-explorer',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    FileExplorerItemComponent,
  ],
  templateUrl: './file-explorer.component.html',
  styleUrl: './file-explorer.component.css',
})
export class FileExplorerComponent {
  private readonly appContext = inject(EditorContextService);
  private readonly inMemoryAppContext = inject(InMemoryContextService);
  private readonly api = getElectronApi();

  /**
   * Represents the root node which represents the selected directory folder itself - typically used for creating files in the root
   */
  rootNode: Signal<fileNode> = computed(() => {
    let node: fileNode = {
      children: [],
      expanded: false,
      extension: '',
      isDirectory: true,
      mode: 'default',
      name: 'Root node',
      parentPath: this.selectedDirectorPath()!,
      path: this.selectedDirectorPath()!,
    };
    return node;
  });

  selectedDirectorPath = computed(() =>
    this.appContext.selectedDirectoryPath(),
  );
  directoryFileNodes = computed(() => this.appContext.directoryFileNodes());
  isExplorerActive = computed(
    () =>
      this.appContext.fileExplorerActiveFileOrFolder()?.path ===
      this.appContext.selectedDirectoryPath(),
  );
  disableCreateFileOrFolder = computed(() =>
    this.inMemoryAppContext.isCreateFileOrFolderActive(),
  );

  constructor() {
    effect(async () => {
      if (this.inMemoryAppContext.refreshDirectory()) {
        await this.merge();
      }
    });

    effect(async () => {
      const currentPath = this.appContext.selectedDirectoryPath();
      const existingNodes = this.directoryFileNodes();

      // If path changed OR we don't have nodes yet
      if (currentPath !== this.previousDirectoryPath) {
        this.previousDirectoryPath = currentPath;

        // If we already have nodes, merge instead of full reload
        if (existingNodes && existingNodes.length > 0) {
          await this.merge();
        } else {
          await this.readDir();
        }
      }
    });
  }

  private previousDirectoryPath: string | null | undefined = undefined;

  /**
   * Reads selected folder path and sets file nodes globally
   */
  async readDir() {
    let nodes = await this.api.fsApi.readDir(this.selectedDirectorPath()!);
    this.appContext.directoryFileNodes.set(nodes);
  }

  /**
   * Runs when colapse folders is clicked will un expand all folder all the way to root
   */
  collapseFolders() {
    let nodes = this.directoryFileNodes();
    collapseNodes(nodes ?? []);

    this.appContext.fileExplorerActiveFileOrFolder.set(this.rootNode());
    this.appContext.directoryFileNodes.set(nodes);
  }

  /**
   * Runs when refresh button clicked - re reads nodes and updates global state
   */
  refreshClicked() {
    this.inMemoryAppContext.refreshDirectory.update((p) => p + 1);
  }

  /**
   * Runs when the backdrop of the container is clicked
   */
  fileExplorerScrollContainerClicked(event: Event) {
    const target = event.target as HTMLElement;
    const container = event.currentTarget as HTMLElement;

    if (target === container) {
      /*Clicked empty space so set the file or folder focus in side bar to root node */
      this.appContext.fileExplorerActiveFileOrFolder.set(this.rootNode());
    }
  }

  /**
   * Runs when the file explorer empty space is doubled clicked making a call to create file logic
   */
  fileExplorerScrollContainerDoubleClicked(event: Event) {
    const target = event.target as HTMLElement;
    const container = event.currentTarget as HTMLElement;

    if (target === container) {
      this.createFileOrFolder('createFile');
    }
  }

  /**
   * Creates a file or folder node in the tree
   * @param mode The specific type of node to create
   */
  createFileOrFolder(mode: fileNodeMode) {
    const nodes = this.directoryFileNodes() ?? [];
    const activeNode = this.appContext.fileExplorerActiveFileOrFolder();

    if (!activeNode) {
      // we need to know where we are creating the new node, which is the last clicked node's location
      console.log('No file or folder in focus');
      return;
    }

    const isRootActive = activeNode.path === this.selectedDirectorPath();

    // Construct the new node - this will handle file or folder render
    const newNode: fileNode = {
      children: [],
      expanded: false,
      isDirectory: false,
      name: 'Editor',
      path: activeNode.path,
      parentPath: activeNode.parentPath,
      mode: mode,
      extension: '',
    };

    if (isRootActive) {
      // here it means the main root was clicked i.e the empty space in file explorer meaning create it in the root folder
      nodes.push(newNode);
    } else if (activeNode.isDirectory) {
      pushNodeIntoChildren(nodes, activeNode, newNode);
    } else {
      // Active node is a file — find its parent and push it to them
      const parent = getNodeParent(nodes, activeNode);
      if (parent) {
        pushNodeIntoChildren(nodes, activeNode, newNode);
      } else {
        console.error('Parent not found for active file node.');
      }
    }

    this.inMemoryAppContext.isCreateFileOrFolderActive.set(true);
    this.appContext.directoryFileNodes.set(nodes);
  }

  /**
   * Merges and synchronizes the current directory structure with the filesystem.
   * - Adds new nodes
   * - Updates existing ones
   * - Removes stale nodes that no longer exist
   */
  private async merge() {
    const rootPath = this.selectedDirectorPath();
    if (!rootPath) {
      console.error('No path');
      return;
    }

    const latest = await this.api.fsApi.readDir(rootPath);
    const current = this.directoryFileNodes() ?? [];

    const updatedNodes = await this.mergeNodes(current, latest);

    this.appContext.directoryFileNodes.set(updatedNodes);
  }

  private async mergeNodes(
    currentNodes: fileNode[],
    latestNodes: fileNode[],
  ): Promise<fileNode[]> {
    const currentMap = new Map<string, fileNode>(
      currentNodes.map((node) => [node.path, node]),
    );

    const result: fileNode[] = [];

    for (const latest of latestNodes) {
      const existing = currentMap.get(latest.path);

      // New node
      if (!existing) {
        result.push({
          ...latest,
          expanded: false,
          mode: 'default',
          children: [],
        });
        continue;
      }

      // Existing node
      const merged: fileNode = {
        ...latest,
        expanded: existing.expanded,
        mode: existing.mode,
        children: existing.children,
      };

      // Only recurse if directory is expanded
      if (merged.isDirectory && merged.expanded) {
        const childLatest = await this.api.fsApi.readDir(merged.path);

        merged.children = await this.mergeNodes(existing.children, childLatest);
      }

      result.push(merged);
    }

    return result;
  }
}
