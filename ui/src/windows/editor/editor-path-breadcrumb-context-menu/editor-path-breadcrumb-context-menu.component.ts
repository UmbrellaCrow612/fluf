import { Component, inject, OnInit, signal } from '@angular/core';
import { fileNode } from '../../../gen/type';
import { EditorFileExplorerTreeComponent } from '../editor-file-explorer-tree/editor-file-explorer-tree.component';
import { ApplicationContextMenuService } from '../../../shared/services/application-context-menu.service';
import { EditorFileOpenerService } from '../core/services/editor-file-opener.service';

/**
 * Displays a menu contetx menu breadcrumb bar item is clicked and displays a tree view for the given node similar to vscode
 */
@Component({
  selector: 'app-editor-path-breadcrumb-context-menu',
  imports: [EditorFileExplorerTreeComponent],
  templateUrl: './editor-path-breadcrumb-context-menu.component.html',
  styleUrl: './editor-path-breadcrumb-context-menu.component.css',
})
export class EditorPathBreadcrumbContextMenuComponent implements OnInit {
  private readonly applicationContextMenuService = inject(
    ApplicationContextMenuService,
  );
  private readonly editorFileOpenerService = inject(EditorFileOpenerService)
  /**
   * Holds error state
   */
  public readonly error = signal<string | null>(null);

  /**
   * Holds loading state
   */
  public readonly isLoading = signal(false);

  /**
   * The node we will render int the UI for the tree viwer
   */
  public readonly targetNode = signal<fileNode | null>(null);

  /**
   * Holds the children of the target node
   */
  public readonly targetNodeChildren = signal<fileNode[]>([]);

  /**
   * Holds the actiev node / last clicked item
   */
  public readonly activeNode = signal<fileNode | null>(null);

  async ngOnInit() {
    const node =
      this.applicationContextMenuService.getInformation<fileNode>().data;
    await this.display(node);
  }

  /**
   * Displays the tree viwer for the given root node
   * @param node The node to render tree for
   */
  private async display(node: fileNode | null) {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      if (!node || !node.isDirectory) {
        throw new Error('Node must be a directory for a root node');
      }

      this.targetNode.set(node);
    } catch (error: any) {
      console.error('Failed to display tree viwer ', error);
      this.error.set(`Failed to display tree viwer ${error?.message}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Updates the target nodes children
   * @param nodes The updated nodes
   */
  public updateRootNodeChildren(nodes: fileNode[]) {
    this.targetNodeChildren.set(nodes);
  }

  /**
   * Updates the active node to the clicked node
   * @param node The selected node
   */
  public updateActiveNode(node: fileNode) {
    this.activeNode.set(node);

    if(!node.isDirectory){
      this.editorFileOpenerService.openFileNodeInEditor(node)
      this.applicationContextMenuService.close()
    }
  }
}
