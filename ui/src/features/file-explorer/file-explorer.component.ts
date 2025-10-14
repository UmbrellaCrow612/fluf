import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FileExplorerItemComponent } from './file-explorer-item/file-explorer-item.component';

@Component({
  selector: 'app-file-explorer',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    FileExplorerItemComponent,
  ],
  templateUrl: './file-explorer.component.html',
  styleUrl: './file-explorer.component.css',
})
export class FileExplorerComponent {
  testFileNode: fileNode = {
    children: [],
    expanded: false,
    isDirectory: false,
    name: 'Test folder one with a long ass name',
    path: '/test.html',
  };
}
