import { Component } from '@angular/core';
import { FileXTopBarComponent } from "./file-x-top-bar/file-x-top-bar.component";
import { FileXTabsComponent } from "./file-x-tabs/file-x-tabs.component";

/**
 * Our custom built file explorer application similar to windows file explorer built inside the IDE to offer fast file exploration.
 */
@Component({
  selector: 'app-file-x',
  imports: [FileXTopBarComponent, FileXTabsComponent],
  templateUrl: './file-x.component.html',
  styleUrl: './file-x.component.css',
})
export class FileXComponent {

}
