import { Component } from '@angular/core';
import { EditorFrameComponent } from "../editor-frame/editor-frame.component";
import { EditorMainContentComponent } from "../editor-main-content/editor-main-content.component";
import { EditorFooterComponent } from "../editor-footer/editor-footer.component";

/**
 * Main entry point component rendered for the editor
 */
@Component({
  selector: 'app-editor-main',
  imports: [EditorFrameComponent, EditorMainContentComponent, EditorFooterComponent],
  templateUrl: './editor-main.component.html',
  styleUrl: './editor-main.component.css',
})
export class EditorMainComponent {

}
