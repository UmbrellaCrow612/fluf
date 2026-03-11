import { Component } from '@angular/core';
import { EditorFileExplorerTreeItemComponent } from '../editor-file-explorer-tree-item/editor-file-explorer-tree-item.component';
import { fileNode } from '../../../gen/type';

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
  // todo take input of tree items

  exampleFileNodes: fileNode[] = [
    {
      children: [],
      expanded: false,
      extension: '',
      isDirectory: true,
      lastModified: '',
      mode: 'default',
      name: 'lorem',
      parentName: 'p',
      parentPath: 'parent',
      path: 'C:\\dev\\fluf\\ui\\src\\windows\\editor',
      size: 1,
    },
  ];
}
