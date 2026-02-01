import { Component, input } from '@angular/core';
import { FileXDirectoryViewChild } from '../types';
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: 'app-file-x-tool-bar-directory-path-viewer-child',
  imports: [MatIcon],
  templateUrl: './file-x-tool-bar-directory-path-viewer-child.component.html',
  styleUrl: './file-x-tool-bar-directory-path-viewer-child.component.css',
})
export class FileXToolBarDirectoryPathViewerChildComponent {
  /**
   * The child to render
   */
  child = input.required<FileXDirectoryViewChild>();
}
