import { Component } from '@angular/core';
import { EditorFileExplorerTreeComponent } from '../editor-file-explorer-tree/editor-file-explorer-tree.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Renders a file explorer with the current files and folders in the select directory
 */
@Component({
  selector: 'app-editor-file-explorer',
  imports: [
    EditorFileExplorerTreeComponent,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './editor-file-explorer.component.html',
  styleUrl: './editor-file-explorer.component.css',
})
export class EditorFileExplorerComponent {}
