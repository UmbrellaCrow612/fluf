import { Component, computed, inject, Signal } from '@angular/core';
import { EditorFileExplorerTreeComponent } from '../editor-file-explorer-tree/editor-file-explorer-tree.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { fileNode } from '../../../gen/type';
import { EditorContextService } from '../editor-context/editor-context.service';
import { normalizePath } from '../core/path-uri-helpers';

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
      parentPath: '',
      path: this.editorContextService.selectedDirectoryPath()!,
      size: 1,
    };
  });

  public isRootNodeActive: Signal<boolean> = computed(() => {
    const activeNode =
      this.editorContextService.fileExplorerActiveFileOrFolder();
    if (!activeNode) {
      return false;
    }
    const rootNode = this.rootNode();

    return normalizePath(rootNode.path) === normalizePath(activeNode.path);
  });

  /**
   * Creates a file node of mode createFile in the tree at the focused file explorer tree item
   */
  public createFile() {}

  /**
   * When the user clicks the empty space in the file explroer we set the active node to be the root node
   */
  public focusFileExplorerRoot() {
    this.editorContextService.fileExplorerActiveFileOrFolder.set(
      this.rootNode(),
    );
  }
}
