import { Component, computed, inject, Signal } from '@angular/core';
import { EditorFileExplorerTreeComponent } from '../editor-file-explorer-tree/editor-file-explorer-tree.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { fileNode, fileNodeMode } from '../../../gen/type';
import { EditorContextService } from '../editor-context/editor-context.service';
import { normalizePath } from '../core/path-uri-helpers';
import { EditorInMemoryContextService } from '../editor-context/editor-in-memory-context.service';
import {
  collapseFileNodeFirstLayer,
  findFileNodeByPath,
  replaceFileNode,
} from '../core/file-node-helpers';
import { A11yModule } from '@angular/cdk/a11y';

/**
 * Renders a file explorer with the current files and folders in the select directory
 */
@Component({
  selector: 'app-editor-file-explorer',
  imports: [
    EditorFileExplorerTreeComponent,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    A11yModule,
  ],
  templateUrl: './editor-file-explorer.component.html',
  styleUrl: './editor-file-explorer.component.css',
})
export class EditorFileExplorerComponent {
  private readonly editorContextService = inject(EditorContextService);
  private readonly editorInMemoryContextService = inject(
    EditorInMemoryContextService,
  );

  /**
   * Creates a simple node that represents a node that will render as a create node for a file or folder
   */
  private createFileOrFolderNode(
    path: string,
    parentPath: string,
    mode: fileNodeMode,
  ): fileNode {
    return {
      children: [],
      expanded: false,
      extension: '',
      isDirectory: false,
      lastModified: '',
      mode: mode,
      name: '',
      parentName: '',
      parentPath: parentPath,
      path: path,
      size: 0,
    };
  }

  /**
   * Keep track of the root node i.e the select directory as the root node, used when creating files or folders in the root level
   */
  private readonly rootNode: Signal<fileNode> = computed(() => {
    return {
      children: [],
      expanded: false,
      extension: '',
      isDirectory: false,
      lastModified: '',
      mode: 'default',
      name: '',
      parentName: '',
      parentPath: this.editorContextService.selectedDirectoryPath()!,
      path: this.editorContextService.selectedDirectoryPath()!,
      size: 1,
    };
  });

  public readonly isRootNodeActive: Signal<boolean> = computed(() => {
    const activeNode =
      this.editorContextService.fileExplorerActiveFileOrFolder();
    if (!activeNode) {
      return false;
    }
    const rootNode = this.rootNode();

    return normalizePath(rootNode.path) === normalizePath(activeNode.path);
  });

  /**
   * Keeps track of if the file explorer actions should be disabled typically when they are already clicked and active user shoud not click them again until state is lost
   */
  public readonly shouldDisableFileExplorerActions: Signal<boolean> = computed(
    () => {
      const flag =
        this.editorInMemoryContextService.isCreateFileOrFolderActive();
      if (!flag) {
        return false;
      }
      return flag;
    },
  );

  /**
   * Collapses the nodes to root
   */
  public collapseDirectoryNodes() {
    const nodes = this.editorContextService.directoryFileNodes() ?? [];
    collapseFileNodeFirstLayer(nodes);
    this.editorContextService.directoryFileNodes.set(structuredClone(nodes));
  }

  /**
   * Updates state to trigger a refresh / re read of the select directory manually by the user
   */
  public refreshDirectory() {
    this.editorInMemoryContextService.refreshDirectory.update((x) => x + 1);
  }

  /**
   * Creates a file node of mode createFile in the tree at the focused file explorer tree item
   */
  public createNode(event: Event, mode: fileNodeMode) {
    event.stopPropagation();

    this.editorInMemoryContextService.isCreateFileOrFolderActive.set(true);

    const rootPath = normalizePath(
      this.editorContextService.selectedDirectoryPath()!,
    );
    const nodes = this.editorContextService.directoryFileNodes() ?? [];
    const activeNode =
      this.editorContextService.fileExplorerActiveFileOrFolder() ??
      this.rootNode();
    const copy = structuredClone(activeNode);

    // Determine the target directory path where the new node will be created
    const targetDirPath = copy.isDirectory ? copy.path : copy.parentPath;

    // Handle special case: If the active node path is the root select directory then we just push onto top level
    if (normalizePath(targetDirPath) === rootPath) {
      nodes.push(
        this.createFileOrFolderNode(targetDirPath, targetDirPath, mode),
      );

      this.editorContextService.directoryFileNodes.set(structuredClone(nodes));
      return;
    }

    // Find the parent node to add the new node to
    const parentNode = findFileNodeByPath(nodes, targetDirPath);
    if (!parentNode) {
      console.error('Could not find parent node for creating new file/folder');
      return;
    }

    const parentCopyNode = structuredClone(parentNode);

    parentCopyNode.children.push(
      this.createFileOrFolderNode(targetDirPath, targetDirPath, mode),
    );

    replaceFileNode(nodes, parentNode, parentCopyNode);
    this.editorContextService.directoryFileNodes.set(structuredClone(nodes));
  }

  /**
   * When the user clicks the empty space in the file explroer we set the active node to be the root node
   */
  public focusFileExplorerRoot() {
    this.editorContextService.fileExplorerActiveFileOrFolder.set(
      this.rootNode(),
    );
  }
}
