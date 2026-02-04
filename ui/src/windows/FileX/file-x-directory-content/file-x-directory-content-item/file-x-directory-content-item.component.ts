import { FileXContextService } from './../../file-x-context/file-x-context.service';
import { Component, computed, inject, input, Signal } from '@angular/core';
import { fileNode } from '../../../../gen/type';
import { MatIcon } from '@angular/material/icon';
import { ChangeActiveDirectory } from '../../utils';
import { FileXInMemoryContextService } from '../../file-x-context/file-x-in-memory-context.service';

@Component({
  selector: 'app-file-x-directory-content-item',
  imports: [MatIcon],
  templateUrl: './file-x-directory-content-item.component.html',
  styleUrl: './file-x-directory-content-item.component.css',
})
export class FileXDirectoryContentItemComponent {
  private readonly fileXContextService = inject(FileXContextService);
  private readonly fileXInMemoryContextService = inject(
    FileXInMemoryContextService,
  );

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
      ChangeActiveDirectory(this.fileNode().path, this.fileXContextService);
    } else {
      // open file - could try and open it in editor ?
    }
  }
}
