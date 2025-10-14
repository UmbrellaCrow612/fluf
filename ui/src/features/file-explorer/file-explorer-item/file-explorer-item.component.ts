import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { getFileExtension } from '../utils';

@Component({
  selector: 'app-file-explorer-item',
  imports: [MatIconModule],
  templateUrl: './file-explorer-item.component.html',
  styleUrl: './file-explorer-item.component.css',
})
export class FileExplorerItemComponent {
  /**
   * The specific file to render as a file tree item
   */
  fileNode = input.required<fileNode>();

  /**
   * The depth it is in the tree structure
   */
  depth = input.required<number>();

  getFileExt = getFileExtension;
}
