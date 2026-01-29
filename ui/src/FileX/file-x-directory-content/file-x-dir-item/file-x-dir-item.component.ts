import { Component, input } from '@angular/core';
import { fileNode } from '../../../gen/type';
import { MatIcon } from '@angular/material/icon';
import { DatePipe } from '@angular/common';

/**
 * Used to render a item read from a directory
 */
@Component({
  selector: 'app-file-x-dir-item',
  imports: [MatIcon, DatePipe],
  templateUrl: './file-x-dir-item.component.html',
  styleUrl: './file-x-dir-item.component.css',
})
export class FileXDirItemComponent {
  /**
   * The specific node read from the directory to render for this given item
   */
  fileNode = input.required<fileNode>();

  /**
   * Receives a Node.js file size (in bytes) and converts it to a readable string
   * like "4 MB", "512 KB", etc.
   */
  formatFileSizeToReadableString(size: number): string {
    if (size === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const index = Math.floor(Math.log(size) / Math.log(1024));

    const readableSize = size / Math.pow(1024, index);

    return `${readableSize.toFixed(2)} ${units[index]}`;
  }
}
