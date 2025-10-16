import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  OnInit,
  viewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  appendChildrenToNode,
  collapseNodeByPath,
  expandNodeByPath,
  getFileExtension,
  removeCreateNodes,
} from '../utils';
import { ContextService } from '../../app-context/app-context.service';
import { getElectronApi } from '../../../utils';

@Component({
  selector: 'app-file-explorer-item',
  imports: [MatIconModule],
  templateUrl: './file-explorer-item.component.html',
  styleUrl: './file-explorer-item.component.css',
})
export class FileExplorerItemComponent implements OnInit, AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly appContext = inject(ContextService);
  private readonly api = getElectronApi();

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
  isFocused = false;

  getFileExt = getFileExtension;

  /**
   * Input rendered when making a file
   */
  createInput = viewChild<ElementRef<HTMLInputElement>>('create_input');

  ngOnInit(): void {
    this.isFocused =
      this.appContext.getSnapshot().fileExplorerActiveFileOrFolder?.path ===
      this.fileNode().path;

    this.appContext.autoSub(
      'fileExplorerActiveFileOrFolder',
      (ctx) => {
        this.isFocused =
          ctx.fileExplorerActiveFileOrFolder?.path === this.fileNode().path;
      },
      this.destroyRef
    );
  }

  ngAfterViewInit(): void {
    if (this.createInput()) {
      this.createInput()?.nativeElement.focus();
    }
  }

  onCreateInputBlur() {
    let nodes = this.appContext.getSnapshot().directoryFileNodes;
    removeCreateNodes(nodes!);

    this.appContext.update('isCreateFileOrFolderActive', false);
    this.appContext.update('directoryFileNodes', nodes);
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
      this.appContext.update('fileExplorerActiveFileOrFolder', this.fileNode());
      return;
    }

    let previousNodes = this.appContext.getSnapshot().directoryFileNodes;

    if (this.fileNode().expanded) {
      collapseNodeByPath(previousNodes!, this.fileNode().path);
      this.appContext.update('fileExplorerActiveFileOrFolder', this.fileNode());
      this.appContext.update('directoryFileNodes', previousNodes);
      return;
    }

    if (!this.fileNode().expanded && this.fileNode().children.length > 0) {
      expandNodeByPath(previousNodes!, this.fileNode().path!);
      this.appContext.update('fileExplorerActiveFileOrFolder', this.fileNode());
      this.appContext.update('directoryFileNodes', previousNodes);
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

    this.appContext.update('fileExplorerActiveFileOrFolder', this.fileNode());
    this.appContext.update('directoryFileNodes', previousNodes);
  }

  /**
   * Runs when right click ran on a specific item
   */
  onRightClick(event: MouseEvent) {
    event.preventDefault();
    this.appContext.update('fileExplorerContextMenufileNode', this.fileNode());
    this.appContext.update('fileExplorerContextMenuClickPosition', {
      x: event.clientX,
      y: event.clientY,
    });
    this.appContext.update('displayFileEplorerContextMenu', true);
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
          this.appContext.update('refreshDirectoryFolderNodes', true);
          this.appContext.update('fileExplorerActiveFileOrFolder', {
            children: [],
            expanded: false,
            isDirectory: false,
            mode: 'default',
            name: value!,
            path: newPath,
            parentPath: ""
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
          this.appContext.update('refreshDirectoryFolderNodes', true);
          this.appContext.update('fileExplorerActiveFileOrFolder', {
            children: [],
            expanded: false,
            isDirectory: true,
            mode: 'default',
            name: value!,
            path: newPath,
            parentPath: ""
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
