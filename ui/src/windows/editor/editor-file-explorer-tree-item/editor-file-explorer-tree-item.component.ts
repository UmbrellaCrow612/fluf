import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  signal,
  Signal,
  viewChild,
} from '@angular/core';
import { fileNode } from '../../../gen/type';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { EditorContextService } from '../editor-context/editor-context.service';
import { normalizePath } from '../core/path-uri-helpers';
import { CoreEditorService } from '../core/services/core-editor.service';
import {
  removeCreateFileNodes,
  replaceFileNode,
} from '../core/file-node-helpers';
import { getElectronApi } from '../../../utils';
import { EditorInMemoryContextService } from '../editor-context/editor-in-memory-context.service';

/**
 * Used to render a given file node content and it's children
 */
@Component({
  selector: 'app-editor-file-explorer-tree-item',
  imports: [MatTooltipModule, MatIconModule],
  templateUrl: './editor-file-explorer-tree-item.component.html',
  styleUrl: './editor-file-explorer-tree-item.component.css',
})
export class EditorFileExplorerTreeItemComponent implements AfterViewInit {
  private readonly editorContextService = inject(EditorContextService);
  private readonly coreEditorService = inject(CoreEditorService);
  private readonly electronApi = getElectronApi();
  private readonly editorInMemoryContextService = inject(EditorInMemoryContextService)

  /**
   * Refrence to the UI element that is rendered when the mode of the file node is set to create a file or folder
   */
  private createInput = viewChild<ElementRef<HTMLInputElement>>(
    'create_tree_item_input',
  );

  /**
   * File node to render
   */
  public fileNode = input.required<fileNode>();

  /**
   * How deep this is being rendered increment each sub child you render
   */
  public depth = input.required<number>();

  /**
   * Calcutes the padding value for the given tree item based on how deep it is in the tree
   */
  public paddingLeftValue: Signal<string> = computed(() => {
    return `${this.depth() * 8}px`;
  });

  /**
   * How long it will take on hover to show tooltip
   */
  public matTooltipShowDelayInMilliseconds = signal(750);

  /**
   * Keeps track of fetching children nodes for the given node
   */
  public isFetchingChildren = signal(false);

  /**
   * Keeps track if there was any error when fetching children
   */
  public fetchingChildrenError = signal<string | null>('');

  /**
   * Keeps track if the given item is active either by being select or open in the editor view
   */
  public isActive: Signal<boolean> = computed(() => {
    let node = this.editorContextService.fileExplorerActiveFileOrFolder();
    if (!node) {
      return false;
    }
    return normalizePath(this.fileNode().path) === normalizePath(node.path);
  });

  ngAfterViewInit() {
    this.focusUserIntoCreateInput();
  }

  /**
   * Trys to focus the user focus into the create input if the file node mode is to create
   */
  private focusUserIntoCreateInput = (): void => {
    const mode = this.fileNode().mode;
    if (mode === 'createFile' || mode == 'createFolder') {
      const input = this.createInput()?.nativeElement;
      if (!input) {
        console.error(
          'Cannot find create input even thou it should be rendered',
        );
        return;
      }
      input.focus();
    }
  };

  /**
   * Attempts to remove all file nodes in the tree that are of mode create
   */
  public removeCreateNodes() {
    const nodes = this.editorContextService.directoryFileNodes() ?? [];
    removeCreateFileNodes(nodes);
    this.editorContextService.directoryFileNodes.set(structuredClone(nodes));
    this.editorInMemoryContextService.isCreateFileOrFolderActive.set(null)
  }

  /**
   * Selects the given tree item node as the new active node i.e opening it explorer if it is a file or expanding it if it is a folder
   */
  public async selectTreeItem(event: Event) {
    event.stopPropagation();

    if (this.isFetchingChildren()) {
      return;
    }
    this.fetchingChildrenError.set(null);

    const node = this.fileNode();

    if (!node.isDirectory) {
      this.coreEditorService.OpenFileNodeInEditor(node);
      return;
    }

    if (node.expanded) {
      const nodes = this.editorContextService.directoryFileNodes() ?? [];
      const copy = structuredClone(node);
      copy.expanded = false;
      const success = replaceFileNode(nodes, node, copy);
      if (!success) {
        console.error('Failed to replce node ', JSON.stringify(node));
      }
      this.editorContextService.directoryFileNodes.set(structuredClone(nodes));
      return;
    }

    if (node.children.length > 0) {
      const nodes = this.editorContextService.directoryFileNodes() ?? [];
      const copy = structuredClone(node);
      copy.expanded = true;
      const success = replaceFileNode(nodes, node, copy);
      if (!success) {
        console.error('Failed to replce node ', JSON.stringify(node));
      }
      this.editorContextService.directoryFileNodes.set(structuredClone(nodes));
      return;
    }

    try {
      this.isFetchingChildren.set(true);

      const children = await this.electronApi.fsApi.readDir(node.path);

      const copy = structuredClone(node);
      copy.children = children;
      copy.expanded = true;

      const nodes = this.editorContextService.directoryFileNodes() ?? [];
      const success = replaceFileNode(nodes, node, copy);
      if (!success) {
        console.error('Failed to replce node ', JSON.stringify(node));
      }

      this.editorContextService.directoryFileNodes.set(structuredClone(nodes));
    } catch (error: any) {
      console.error('Failed to fetch children for node ', error);
      this.fetchingChildrenError.set(
        `Failed to fetch children for node ${error?.message}`,
      );
    } finally {
      this.isFetchingChildren.set(false);
    }
  }
}
