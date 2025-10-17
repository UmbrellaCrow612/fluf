import { Component } from '@angular/core';
import { OpenFileContainerTabsComponent } from "./open-file-container-tabs/open-file-container-tabs.component";
import { OpenFileEditorComponent } from "./open-file-editor/open-file-editor.component";

@Component({
  selector: 'app-open-file-container',
  imports: [OpenFileContainerTabsComponent, OpenFileEditorComponent],
  templateUrl: './open-file-container.component.html',
  styleUrl: './open-file-container.component.css'
})
export class OpenFileContainerComponent {

}
