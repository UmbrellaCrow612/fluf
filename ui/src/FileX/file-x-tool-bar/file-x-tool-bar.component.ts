import { Component } from '@angular/core';
import { FileXToolBarDirectoryPathViewerComponent } from "../file-x-tool-bar-directory-path-viewer/file-x-tool-bar-directory-path-viewer.component";
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-file-x-tool-bar',
  imports: [FileXToolBarDirectoryPathViewerComponent, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './file-x-tool-bar.component.html',
  styleUrl: './file-x-tool-bar.component.css',
})
export class FileXToolBarComponent {

}
