import { Component, input } from '@angular/core';
import { fileNode } from '../../../../gen/type';

@Component({
  selector: 'app-file-x-directory-content-item',
  imports: [],
  templateUrl: './file-x-directory-content-item.component.html',
  styleUrl: './file-x-directory-content-item.component.css',
})
export class FileXDirectoryContentItemComponent {
  /**
   * The given node to render as a itemF
   */
  fileNode = input.required<fileNode>();
}
