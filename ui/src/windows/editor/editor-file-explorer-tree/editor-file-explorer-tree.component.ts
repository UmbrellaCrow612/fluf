import { Component, computed, inject, Signal } from '@angular/core';
import { EditorFileExplorerTreeItemComponent } from '../editor-file-explorer-tree-item/editor-file-explorer-tree-item.component';
import { fileNode } from '../../../gen/type';
import { EditorContextService } from '../editor-context/editor-context.service';

/**
 * Main component in file explorer that renders the actual file nodes in a tree / file pattern:
 *
 * Like:
 *
 * ```markdown
 * --- foo (folder opended)
 * ------ bar.html (file)
 * ---- bazz
 * ------ too.py
 *
 * ```
 * etc
 */
@Component({
  selector: 'app-editor-file-explorer-tree',
  imports: [EditorFileExplorerTreeItemComponent],
  templateUrl: './editor-file-explorer-tree.component.html',
  styleUrl: './editor-file-explorer-tree.component.css',
})
export class EditorFileExplorerTreeComponent {
  private readonly editorContextService = inject(EditorContextService);

  /**
   * Keeps track of the nodes for the selected directory
   */
  public selectedDirectoryFileNodes: Signal<fileNode[]> = computed(() => {
    return this.editorContextService.directoryFileNodes() ?? [];
  });

  public testNodes: fileNode[] = [
    {
      mode: 'createFile',
      children: [],
      expanded: false,
      extension: '',
      isDirectory: false,
      lastModified: '',
      name: '',
      parentName: '',
      parentPath: '',
      path: 'C:\\dev\\fluf\\ui\\src\\windows',
      size: 1,
    },
  ];
}
