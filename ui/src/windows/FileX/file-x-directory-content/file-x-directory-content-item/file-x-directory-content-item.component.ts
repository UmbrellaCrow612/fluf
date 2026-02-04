import { FileXContextService } from './../../file-x-context/file-x-context.service';
import { Component, inject, input } from '@angular/core';
import { fileNode } from '../../../../gen/type';
import { MatIcon } from '@angular/material/icon';
import { ChangeActiveDirectory } from '../../utils';

@Component({
  selector: 'app-file-x-directory-content-item',
  imports: [MatIcon],
  templateUrl: './file-x-directory-content-item.component.html',
  styleUrl: './file-x-directory-content-item.component.css',
})
export class FileXDirectoryContentItemComponent {
  private readonly fileXContextService = inject(FileXContextService);

  /**
   * The given node to render as a item
   */
  fileNode = input.required<fileNode>();

  /**
   * Used to set the item as selected
   */
  selectedItem() {}

  /**
   * Trys to go into a folder if it it is a directory or open the it if it is a file
   */
  goIntoItem() {
    if (this.fileNode().isDirectory) {
      ChangeActiveDirectory(this.fileNode().path, this.fileXContextService);
    } else {
      // open file - could try and open it in editor ? 
    }
  }
}
