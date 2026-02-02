import { Component, input } from '@angular/core';
import { fileNode } from '../../../../gen/type';
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: 'app-file-x-directory-content-item',
  imports: [MatIcon],
  templateUrl: './file-x-directory-content-item.component.html',
  styleUrl: './file-x-directory-content-item.component.css',
})
export class FileXDirectoryContentItemComponent {
  /**
   * The given node to render as a itemF
   */
  fileNode = input.required<fileNode>();
}
