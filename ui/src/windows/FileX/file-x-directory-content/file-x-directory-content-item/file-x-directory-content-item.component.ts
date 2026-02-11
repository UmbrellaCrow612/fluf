import { FileXContextService } from './../../file-x-context/file-x-context.service';
import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  OnInit,
  output,
  Signal,
  viewChild,
} from '@angular/core';
import { fileNode } from '../../../../gen/type';
import { MatIcon } from '@angular/material/icon';
import { ChangeActiveDirectory } from '../../utils';
import { FileXInMemoryContextService } from '../../file-x-context/file-x-in-memory-context.service';
import { FileXCreateFileOrFolderValues } from '../../types';

/**
 * Renders a directory item representing a file or folder
 */
@Component({
  selector: 'app-file-x-directory-content-item',
  imports: [MatIcon],
  templateUrl: './file-x-directory-content-item.component.html',
  styleUrl: './file-x-directory-content-item.component.css',
})
export class FileXDirectoryContentItemComponent implements OnInit {
  private readonly fileXContextService = inject(FileXContextService);
  private readonly fileXInMemoryContextService = inject(
    FileXInMemoryContextService,
  );

  ngOnInit(): void {
    setTimeout(() => {
      this.focusCreateInput();
    }, 10); // wait for angular to resolve UI
  }

  /**
   * Trys to focus the create input
   */
  private focusCreateInput = () => {
    let mode = this.fileNode().mode;
    if (mode === 'default') {
      return;
    }

    let input = this.createInputRef()?.nativeElement;
    if (!input) {
      console.error(
        'Either this is being run for a mode that does not render the create input or it has not yet rendered in the DOM',
      );
      return;
    }

    input.focus();
  };

  /**
   * Ref to the create input template
   */
  private readonly createInputRef =
    viewChild<ElementRef<HTMLInputElement>>('createInput');

  /**
   * Indicates if the given item is selected
   */
  isSelected: Signal<boolean> = computed(() => {
    console.log('selected item ran');
    let selectedItems = this.fileXInMemoryContextService.selectedItems();
    let isSelected =
      selectedItems.find((x) => x.path == this.fileNode().path) !== undefined;
    return isSelected;
  });

  /**
   * The given node to render as a item
   */
  fileNode = input.required<fileNode>();

  /**
   * Emits when a file creation is rendered and then user loses focus on the input
   */
  createInputFocusLost = output();

  /**
   * Selects or un-selects an item
   */
  selectedItem(event: MouseEvent) {
    event.stopPropagation(); // parent backdrop click deselects items

    const selectedItems = this.fileXInMemoryContextService.selectedItems();
    const filePath = this.fileNode().path;

    const existingIndex = selectedItems.findIndex((x) => x.path === filePath);

    if (event.ctrlKey) {
      // Ctrl-click: toggle selection
      if (existingIndex >= 0) {
        selectedItems.splice(existingIndex, 1); // deselect
      } else {
        selectedItems.push(this.fileNode()); // select
      }
    } else {
      // Normal click
      if (existingIndex >= 0 && selectedItems.length === 1) {
        // Clicking the only selected item -> deselect it
        selectedItems.length = 0;
      } else {
        // Select only this item
        selectedItems.length = 0;
        selectedItems.push(this.fileNode());
      }
    }

    this.fileXInMemoryContextService.selectedItems.set(
      structuredClone(selectedItems),
    );
  }

  /**
   * Trys to go into a folder if it it is a directory or open the it if it is a file
   */
  goIntoItem(event: Event) {
    event.stopPropagation(); // parent click de selects items
    if (this.fileNode().isDirectory) {
      ChangeActiveDirectory(
        this.fileNode().path,
        this.fileXContextService,
        this.fileXInMemoryContextService,
      );
    } else {
      // open file - could try and open it in editor ?
    }
  }
}
