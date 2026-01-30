import { Component } from '@angular/core';
import { FileXTopBarComponent } from "./file-x-top-bar/file-x-top-bar.component";
import { FileXToolBarComponent } from "./file-x-tool-bar/file-x-tool-bar.component";

/**
 * Our custom built file explorer application similar to windows file explorer built inside the IDE to offer fast file exploration.
 */
@Component({
  selector: 'app-file-x',
  imports: [FileXTopBarComponent, FileXToolBarComponent],
  templateUrl: './file-x.component.html',
  styleUrl: './file-x.component.css',
})
export class FileXComponent {

}
