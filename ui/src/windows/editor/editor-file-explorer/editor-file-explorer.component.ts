import {
  AfterViewInit,
  Component,
  computed,
  inject,
  Signal,
} from "@angular/core";
import { EditorFileExplorerTreeComponent } from "../editor-file-explorer-tree/editor-file-explorer-tree.component";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { fileNode, fileNodeMode } from "../../../gen/type";
import { A11yModule } from "@angular/cdk/a11y";
import { EditorInMemoryStateService } from "../core/state/editor-in-memory-state.service";
import { EditorStateService } from "../core/state/editor-state.service";
import {
  collapseFileNodeFirstLayer,
  findFileNodeByPath,
  replaceFileNode,
} from "../../../shared/file-node-helpers";
import { normalize } from "../../../lib/path";
import { EditorSidebarPaneService } from "../core/panes/editor-sidebar-pane.service";
import { EditorFileExplorerService } from "./services/editor-file-explorer.service";
import { EditorWorkspaceService } from "../core/workspace/editor-workspace.service";

/**
 * Renders a file explorer with the current files and folders in the select directory
 */
@Component({
  selector: "app-editor-file-explorer",
  imports: [
    EditorFileExplorerTreeComponent,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    A11yModule,
  ],
  templateUrl: "./editor-file-explorer.component.html",
  styleUrl: "./editor-file-explorer.component.css",
})
export class EditorFileExplorerComponent implements AfterViewInit {
  private readonly editorStateService = inject(EditorStateService);
  private readonly editorInMemoryStateService = inject(
    EditorInMemoryStateService,
  );
  private readonly editorSidebarPaneService = inject(EditorSidebarPaneService);
  private readonly editorFileExplorerService = inject(
    EditorFileExplorerService,
  );
  private readonly editorWorkspaceService = inject(EditorWorkspaceService);

  public ngAfterViewInit() {
    this.editorSidebarPaneService.resolvePane();
  }

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
      extension: "",
      isDirectory: false,
      lastModified: "",
      mode: mode,
      name: "",
      parentName: "",
      parentPath: parentPath,
      path: path,
      size: 0,
    };
  }

  /**
   * Keep track of the root node i.e the select directory as the root node, used when creating files or folders in the root level
   */
  public readonly rootNode: Signal<fileNode> = computed(() => {
    return {
      children: [],
      expanded: false,
      extension: "",
      isDirectory: false,
      lastModified: "",
      mode: "default",
      name: "",
      parentName: "",
      parentPath: this.editorWorkspaceService.workspace()!,
      path: this.editorWorkspaceService.workspace()!,
      size: 1,
    };
  });

  /**
   * Keeps track of the current selected directory nodes
   */
  public readonly rootNodeChildren: Signal<fileNode[]> =
    this.editorFileExplorerService.nodes;

  /**
   * Keeps track of the current file in the editor
   */
  public readonly activeNode: Signal<fileNode | null> = computed(() =>
    this.editorStateService.fileExplorerActiveFileOrFolder(),
  );

  /**
   * Updates the session state nodes for the selected directory root node
   * @param nodes The updates nodes
   */
  public updateRootNodeChildren(nodes: fileNode[]) {
    this.editorFileExplorerService.update(nodes);
  }

  /**
   * Update the file explroer last clicked / active node to the clicked child
   * @param node The node clicked
   */
  public itemSelected(node: fileNode) {
    this.editorStateService.fileExplorerActiveFileOrFolder.set(node);
  }

  public readonly isRootNodeActive: Signal<boolean> = computed(() => {
    const activeNode = this.editorStateService.fileExplorerActiveFileOrFolder();
    if (!activeNode) {
      return false;
    }
    const rootNode = this.rootNode();

    return normalize(rootNode.path) === normalize(activeNode.path);
  });

  /**
   * Keeps track of if the file explorer actions should be disabled typically when they are already clicked and active user shoud not click them again until state is lost
   */
  public readonly shouldDisableFileExplorerActions: Signal<boolean> = computed(
    () => {
      const flag = this.editorInMemoryStateService.isCreateFileOrFolderActive();
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
    const nodes = this.editorFileExplorerService.nodes();
    collapseFileNodeFirstLayer(nodes);
    this.editorFileExplorerService.update(nodes);
  }

  /**
   * Updates state to trigger a refresh / re read of the select directory manually by the user
   */
  public refreshDirectory() {
    this.editorInMemoryStateService.refreshDirectory.update((x) => x + 1);
  }

  /**
   * Creates a file node of mode createFile in the tree at the focused file explorer tree item
   */
  public createNode(event: Event, mode: fileNodeMode) {
    event.stopPropagation();

    this.editorInMemoryStateService.isCreateFileOrFolderActive.set(true);

    const rootPath = normalize(this.editorWorkspaceService.workspace()!);
    const nodes = this.editorFileExplorerService.nodes();
    const activeNode =
      this.editorStateService.fileExplorerActiveFileOrFolder() ??
      this.rootNode();
    const copy = structuredClone(activeNode);

    // Determine the target directory path where the new node will be created
    const targetDirPath = copy.isDirectory ? copy.path : copy.parentPath;

    // Handle special case: If the active node path is the root select directory then we just push onto top level
    if (normalize(targetDirPath) === rootPath) {
      nodes.push(
        this.createFileOrFolderNode(targetDirPath, targetDirPath, mode),
      );

      this.editorFileExplorerService.update(nodes);
      return;
    }

    // Find the parent node to add the new node to
    const parentNode = findFileNodeByPath(nodes, targetDirPath);
    if (!parentNode) {
      console.error("Could not find parent node for creating new file/folder");
      return;
    }

    const parentCopyNode = structuredClone(parentNode);

    parentCopyNode.children.push(
      this.createFileOrFolderNode(targetDirPath, targetDirPath, mode),
    );

    replaceFileNode(nodes, parentNode, parentCopyNode);
    this.editorFileExplorerService.update(nodes);
  }

  /**
   * When the user clicks the empty space in the file explroer we set the active node to be the root node
   */
  public focusFileExplorerRoot() {
    this.editorStateService.fileExplorerActiveFileOrFolder.set(this.rootNode());
  }
}
