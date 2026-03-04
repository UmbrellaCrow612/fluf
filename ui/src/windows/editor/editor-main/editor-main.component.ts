import { Component } from '@angular/core';
import { EditorFrameComponent } from "../editor-frame/editor-frame.component";

/**
 * Main entry point component rendered for the editor
 */
@Component({
  selector: 'app-editor-main',
  imports: [EditorFrameComponent],
  templateUrl: './editor-main.component.html',
  styleUrl: './editor-main.component.css',
})
export class EditorMainComponent {

}
