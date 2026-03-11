import { Component, input } from '@angular/core';
import { fileNode } from '../../../gen/type';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Used to render a given file node content and it's children
 */
@Component({
  selector: 'app-editor-file-explorer-tree-item',
  imports: [MatTooltipModule],
  templateUrl: './editor-file-explorer-tree-item.component.html',
  styleUrl: './editor-file-explorer-tree-item.component.css',
})
export class EditorFileExplorerTreeItemComponent {
  /**
   * File node to render
   */
  public fileNode = input.required<fileNode>();

  /**
   * How long it will take on hover to show tooltip
   */
  public matTooltipShowDelayInMilliseconds = 750;
}
