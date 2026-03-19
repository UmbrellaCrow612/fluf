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
import { EditorFileOpenerService } from '../core/services/editor-file-opener.service';
import {
  removeTempoaryFileNodes,
  replaceFileNode,
} from '../core/file-node-helpers';
import { getElectronApi } from '../../../utils';
import { EditorInMemoryContextService } from '../editor-context/editor-in-memory-context.service';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ApplicationContextMenuService } from '../../../shared/application-context-menu/services/application-context-menu.service';
import { EditorFileExplorerContextMenuComponent } from '../editor-file-explorer-context-menu/editor-file-explorer-context-menu.component';

/**
 * Used to render a given file node content and it's children
 */
@Component({
  selector: 'app-editor-file-explorer-tree-item',
  imports: [MatTooltipModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './editor-file-explorer-tree-item.component.html',
  styleUrl: './editor-file-explorer-tree-item.component.css',
})
export class EditorFileExplorerTreeItemComponent implements AfterViewInit {
  private readonly editorContextService = inject(EditorContextService);
  private readonly editorFileOpenerService = inject(
    EditorFileOpenerService,
  );
  private readonly electronApi = getElectronApi();
  private readonly editorInMemoryContextService = inject(
    EditorInMemoryContextService,
  );
  private readonly applicationContextMenuService = inject(
    ApplicationContextMenuService,
  );

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
   * Keeps track when creating a file or folder in the system
   */
  public isCreatingOrRenamingFileOrFolder = signal(false);

  /**
   * Keeps track of any errors that occured when creating file or folder in the system or renaming it
   */
  public createOrRenameFileOrFolderError = signal<string | null>(null);

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

  /**
   * Holds the state for the create file or folder form
   */
  public createInputForm = new FormGroup({
    /**
     * The name of the file or folder to create
     */
    name: new FormControl(
      { value: '', disabled: this.isCreatingOrRenamingFileOrFolder() },
      {
        validators: [Validators.required],
      },
    ),
  });

  ngAfterViewInit() {
    this.focusUserIntoCreateInput();
    this.setInitalInputValue();
  }

  /**
   * Gets errors for create input name field
   */
  public getCreateInputError(): string {
    const control = this.createInputForm.get('name');
    if (control?.hasError('required')) return 'Name is required';
    return '';
  }

  /**
   * Attempts to create a file or folder in the system from the form values or rename it
   */
  public async createOrRenameFileOrFolder(event: Event) {
    event.preventDefault();

    this.createOrRenameFileOrFolderError.set(null);

    if (this.isCreatingOrRenamingFileOrFolder()) {
      return;
    }

    if (this.createInputForm.invalid) {
      this.createOrRenameFileOrFolderError.set(
        `Form invalid ${this.getCreateInputError()}`,
      );
      return;
    }

    try {
      this.isCreatingOrRenamingFileOrFolder.set(true);

      const fileOrFolderName = this.createInputForm.controls.name.value!;

      // Handle rename mode
      if (this.fileNode().mode === 'rename') {
        await this.handleRename(fileOrFolderName);
        return;
      }

      // Handle create new file or folder

      const pathToCreate = await this.electronApi.pathApi.join(
        this.fileNode().path,
        fileOrFolderName,
      );
      const exists = await this.electronApi.fsApi.exists(pathToCreate);
      if (exists) {
        const errMessage =
          this.fileNode().mode === 'createFile'
            ? 'File already exists'
            : 'Folder already exists';
        throw new Error(errMessage);
      }

      if (this.fileNode().mode === 'createFile') {
        const res = await this.electronApi.fsApi.createFile(pathToCreate);
        if (!res) {
          throw new Error('Failed to create file');
        }
      } else {
        const res = await this.electronApi.fsApi.createDirectory(pathToCreate);
        if (!res) {
          throw new Error('Failed to create folder');
        }
      }

      console.log('created at path ', pathToCreate);
      this.deleteTemporaryNodes();
    } catch (error: any) {
      console.error('Failed to create / rename file or folder ', error);
      this.createOrRenameFileOrFolderError.set(
        `Failed to crerate file or folder ${error?.message}`,
      );
    } finally {
      this.isCreatingOrRenamingFileOrFolder.set(false);
    }
  }

  /**
   * Attempts to rename the given file name to the new one
   * @param newName The new name of the file
   */
  private async handleRename(newName: string): Promise<void> {
    const orginalName = this.fileNode().name;

    if (newName === orginalName) {
      // no change so we just ignore
      return;
    }

    const parentPath = await this.electronApi.pathApi.dirname(
      this.fileNode().path,
    );
    const newPath = await this.electronApi.pathApi.join(parentPath, newName);

    const exists = await this.electronApi.fsApi.exists(newPath);
    if (exists) {
      throw new Error(
        this.fileNode().isDirectory
          ? 'A folder with this name already exists'
          : 'A file with this name already exists',
      );
    }

    const suc = await this.electronApi.fsApi.rename(
      this.fileNode().path,
      newPath,
    );
    if (!suc) {
      throw new Error(
        this.fileNode().isDirectory
          ? 'Folder rename failed'
          : 'File reanem failed',
      );
    }

    this.deleteTemporaryNodes();

    console.log(`Reanmed node`);
  }

  /**
   * Trys to focus the user focus into the create input if the file node mode is to create
   */
  private focusUserIntoCreateInput = (): void => {
    const mode = this.fileNode().mode;
    if (mode !== 'default') {
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
   * Sets the inital value of the create input if it exists, on rename set the inital file node value name as the input value name.
   */
  private setInitalInputValue() {
    const mode = this.fileNode().mode;
    if (mode === 'rename') {
      this.createInputForm.controls.name.setValue(this.fileNode().name);
    }
  }

  /**
   * Attempts to remove all file nodes in the tree that are not default i.e create rename etc
   */
  public deleteTemporaryNodes() {
    const nodes = this.editorContextService.directoryFileNodes() ?? [];
    removeTempoaryFileNodes(nodes);
    this.editorContextService.directoryFileNodes.set(structuredClone(nodes));
    this.editorInMemoryContextService.isCreateFileOrFolderActive.set(null);
  }

  /**
   * Display the context menu
   * @param event The mouse event
   */
  public displayContextMenu(event: Event) {
    this.applicationContextMenuService.open(
      EditorFileExplorerContextMenuComponent,
      event,
    );
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
      this.editorFileOpenerService.openFileNodeInEditor(node);
      return;
    }

    this.editorContextService.fileExplorerActiveFileOrFolder.set(node);

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
