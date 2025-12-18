import {
  AfterViewInit,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  OnInit,
  viewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  addUniqueFile,
  appendChildrenToNode,
  collapseNodeByPath,
  expandNodeByPath,
  getExtension,
  getFileExtension,
  removeCreateNodes,
} from '../utils';
import { ContextService } from '../../app-context/app-context.service';
import { getElectronApi } from '../../../utils';
import { InMemoryContextService } from '../../app-context/app-in-memory-context.service';
import { hasImageExtension } from '../../img-editor/utils';
import { hasDocumentExtension } from '../../document-editor/utils';
import { fileNode } from '../../../gen/type';

@Component({
  selector: 'app-file-explorer-item',
  imports: [MatIconModule],
  templateUrl: './file-explorer-item.component.html',
  styleUrl: './file-explorer-item.component.css',
})
export class FileExplorerItemComponent implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly appContext = inject(ContextService);
  private readonly api = getElectronApi();
  private readonly inMemoryContextService = inject(InMemoryContextService);

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
  isFocused = computed(() => this.appContext.fileExplorerActiveFileOrFolder()?.path === this.fileNode().path);

  getFileExt = getFileExtension;

  /**
   * Input rendered when making a file
   */
  createInput = viewChild<ElementRef<HTMLInputElement>>('create_input');

  ngAfterViewInit(): void {
    if (this.createInput()) {
      this.createInput()?.nativeElement.focus();
    }
  }

  onCreateInputBlur() {
    let nodes = this.appContext.directoryFileNodes();
    removeCreateNodes(nodes ?? []);

    this.inMemoryContextService.isCreateFileOrFolderActive.set(false);
    this.appContext.directoryFileNodes.set(nodes);
  }

  onInputChange(event: Event) {
    event.preventDefault();
    this.createInput()?.nativeElement.setCustomValidity('');
  }

  /**
   * Runs when a file explorer item is clicked
   */
  async itemClicked(event: Event) {
    event.preventDefault();

    if (!this.fileNode().isDirectory) {
      this.appContext.fileExplorerActiveFileOrFolder.set(this.fileNode());

      let files = this.appContext.openFiles() ?? []
      addUniqueFile(files, this.fileNode());

      this.appContext.openFiles.set(structuredClone(files)); // becuase of js refrence bs
      this.appContext.currentOpenFileInEditor.set(this.fileNode());

      let isImg = hasImageExtension(this.fileNode().extension);
      if (isImg) {
        this.appContext.editorMainActiveElement.set('image-editor');
        return;
      }

      let isDoc = hasDocumentExtension(this.fileNode().extension);
      if (isDoc) {
        this.appContext.editorMainActiveElement.set('document-editor');
        return;
      }

      this.appContext.editorMainActiveElement.set('text-file-editor');
      return;
    }

    let previousNodes = this.appContext.directoryFileNodes();

    if (this.fileNode().expanded) {
      collapseNodeByPath(previousNodes!, this.fileNode().path);
      this.appContext.fileExplorerActiveFileOrFolder.set(this.fileNode());
      this.appContext.directoryFileNodes.set(previousNodes);
      return;
    }

    if (!this.fileNode().expanded && this.fileNode().children.length > 0) {
      expandNodeByPath(previousNodes!, this.fileNode().path!);
      this.appContext.fileExplorerActiveFileOrFolder.set(this.fileNode());
      this.appContext.directoryFileNodes.set(previousNodes);
      return;
    }

    let newChildrenNodes = await this.api.readDir(
      undefined,
      this.fileNode().path
    );

    appendChildrenToNode(
      previousNodes!,
      this.fileNode().path,
      newChildrenNodes
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
    const newPath = await this.api.normalize(
      undefined,
      `${parentPath}/${value}`
    );

    try {
      if (this.fileNode().mode === 'createFile') {
        const fileExists = await this.api.fileExists(undefined, newPath);
        const folderExists = await this.api.directoryExists(undefined, newPath);

        if (fileExists || folderExists) {
          inputEl?.setCustomValidity(
            folderExists
              ? 'A folder with this name already exists'
              : 'A file with this name already exists'
          );
          inputEl?.reportValidity();
          return;
        }

        const suc = await this.api.createFile(undefined, newPath);
        if (suc) {
          this.onCreateInputBlur();
          this.appContext.fileExplorerActiveFileOrFolder.set({
            children: [],
            expanded: false,
            isDirectory: false,
            mode: 'default',
            name: value!,
            path: newPath,
            parentPath: '',
            extension: getExtension(value) ?? '',
          });
        } else {
          inputEl?.setCustomValidity('File creation operation failed');
          inputEl?.reportValidity();
        }
      }

      if (this.fileNode().mode === 'createFolder') {
        const folderExists = await this.api.directoryExists(undefined, newPath);
        const fileExists = await this.api.fileExists(undefined, newPath);

        if (folderExists || fileExists) {
          inputEl?.setCustomValidity(
            folderExists
              ? 'A folder with this name already exists'
              : 'A file with this name already exists'
          );
          inputEl?.reportValidity();
          return;
        }

        const suc = await this.api.createDirectory(undefined, newPath);
        if (suc) {
          this.onCreateInputBlur();
          this.appContext.fileExplorerActiveFileOrFolder.set({
            children: [],
            expanded: false,
            isDirectory: true,
            mode: 'default',
            name: value!,
            path: newPath,
            parentPath: '',
            extension: getExtension(value) ?? '',
          });
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
