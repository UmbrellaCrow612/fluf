import { Component, computed, inject, Signal } from '@angular/core';
import { EditorFileExplorerTreeComponent } from '../editor-file-explorer-tree/editor-file-explorer-tree.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { fileNode } from '../../../gen/type';
import { EditorContextService } from '../editor-context/editor-context.service';
import { normalizePath } from '../core/path-uri-helpers';
import { EditorInMemoryContextService } from '../editor-context/editor-in-memory-context.service';

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
   * Creates a file node of mode createFile in the tree at the focused file explorer tree item
   */
  public createFile() {
    this.editorInMemoryContextService.isCreateFileOrFolderActive.set(true)

    // read acvtive node then 
    // either create it in the parent node children 
    // or create itr in root
    // or create it in the child of the active node 

    // when creating it the we need to pass the propeties across from it correctly 
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
