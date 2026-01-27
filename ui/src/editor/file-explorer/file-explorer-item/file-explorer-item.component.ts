import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { EditorContextService } from '../../app-context/editor-context.service';
import { getElectronApi } from '../../../utils';
import { EditorInMemoryContextService } from '../../app-context/editor-in-memory-context.service';
import { fileNode } from '../../../gen/type';
import {
  addNodeIfNotExists,
  collapseNodeByPath,
  expandNodeByPath,
  pushNodesIntoChildrenByPath,
  removeCreateNodes,
} from '../fileNode';
import { OpenNodeInEditor } from '../helper';

@Component({
  selector: 'app-file-explorer-item',
  imports: [MatIconModule],
  templateUrl: './file-explorer-item.component.html',
  styleUrl: './file-explorer-item.component.css',
})
export class FileExplorerItemComponent implements AfterViewInit {
  private readonly appContext = inject(EditorContextService);
  private readonly api = getElectronApi();
  private readonly inMemoryContextService = inject(EditorInMemoryContextService);

  /**
   * The specific file to render as a file tree item
   */
  fileNode = input.required<fileNode>();

  /**
   * The depth it is in the tree structure
   */
  depth = input.required<number>();

  /**
   * Indicates if the item is clicked on show focus state either if the current file is shown
   * as the current edit file or if it is just a folder clicked in explorer
   */
  isFocused = computed(
    () =>
      this.appContext.fileExplorerActiveFileOrFolder()?.path ===
      this.fileNode().path,
  );

  /**
   * Input rendered when making a file
   */
  createInput = viewChild<ElementRef<HTMLInputElement>>('create_input');

  ngAfterViewInit(): void {
    if (this.createInput()) {
      this.createInput()?.nativeElement.focus();
    }
  }

  /** Runs when the user clicked outisde of the input */
  onCreateInputBlur() {
    let nodes = this.appContext.directoryFileNodes();
    let newNodes = removeCreateNodes(nodes ?? []);

    this.inMemoryContextService.isCreateFileOrFolderActive.set(false);
    this.appContext.directoryFileNodes.set(newNodes);
  }

  onInputChange(event: Event) {
    event.preventDefault();
    this.createInput()?.nativeElement.setCustomValidity('');
  }

  /**
   * Runs when a file explorer item is clicked
   *
   * - Expands it if it is a dir fetches children
   * - Sets it as active node
   * - adds it to open files tab
   * other stuff
   */
  async itemClicked(event: Event) {
    event.preventDefault();

    if (!this.fileNode().isDirectory) {
      OpenNodeInEditor(this.fileNode(), this.appContext);
      return;
    }

    // clicked a dir folder

    let previousNodes = this.appContext.directoryFileNodes() ?? [];

    if (this.fileNode().expanded) {
      collapseNodeByPath(previousNodes, this.fileNode().path);

      this.appContext.fileExplorerActiveFileOrFolder.set(this.fileNode());
      this.appContext.directoryFileNodes.set(previousNodes);
      return;
    }

    if (!this.fileNode().expanded && this.fileNode().children.length > 0) {
      expandNodeByPath(previousNodes!, this.fileNode().path);

      this.appContext.fileExplorerActiveFileOrFolder.set(this.fileNode());
      this.appContext.directoryFileNodes.set(previousNodes);
      return;
    }

    let newChildrenNodes = await this.api.fsApi.readDir(this.fileNode().path);

    pushNodesIntoChildrenByPath(
      previousNodes,
      this.fileNode().path,
      newChildrenNodes,
    );

    this.appContext.fileExplorerActiveFileOrFolder.set(this.fileNode());
    this.appContext.directoryFileNodes.set(previousNodes);
  }

  /**
   * Runs when right click ran on a specific item
   */
  onRightClick(event: MouseEvent) {
    event.preventDefault();

    this.inMemoryContextService.currentActiveContextMenu.set({
      data: this.fileNode(),
      key: 'file-explorer-file-node-context-menu',
      pos: {
        mouseX: event.clientX,
        mouseY: event.clientY,
      },
    });
  }

  async createFileOrFolder(e: Event) {
    e.preventDefault();
    const inputEl = this.createInput()?.nativeElement;
    const value = inputEl?.value.trim();
    if (!value) return;

    const parentPath = this.fileNode().path;
    const newPath = await this.api.pathApi.normalize(`${parentPath}/${value}`);

    try {
      if (this.fileNode().mode === 'createFile') {
        const exists = await this.api.fsApi.exists(newPath);

        if (exists) {
          inputEl?.setCustomValidity(
            'A folder  or file with this name already exists',
          );
          inputEl?.reportValidity();
          return;
        }

        const suc = await this.api.fsApi.createFile(newPath);
        if (suc) {
          this.onCreateInputBlur();
          this.inMemoryContextService.refreshDirectory.update((p) => p + 1);
        } else {
          inputEl?.setCustomValidity('File creation operation failed');
          inputEl?.reportValidity();
        }
      }

      if (this.fileNode().mode === 'createFolder') {
        const exists = await this.api.fsApi.exists(newPath);

        if (exists) {
          inputEl?.setCustomValidity(
            'A folder or file with this name already exists',
          );
          inputEl?.reportValidity();
          return;
        }

        const suc = await this.api.fsApi.createDirectory(newPath);
        if (suc) {
          this.onCreateInputBlur();
          this.inMemoryContextService.refreshDirectory.update((p) => p + 1);
        } else {
          inputEl?.setCustomValidity('Folder creation operation failed');
          inputEl?.reportValidity();
        }
      }
    } catch (err) {
      console.error('Error creating file or folder:', err);
      inputEl?.setCustomValidity('An unexpected error occurred');
      inputEl?.reportValidity();
    }
  }
}
