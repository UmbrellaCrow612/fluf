import { Component } from '@angular/core';
import { EditorTerminalTabsComponent } from "../editor-terminal-tabs/editor-terminal-tabs.component";

/**
 * Renders the terminal component which handles terminal sessions and displays a UI to interact with live sessions
 */
@Component({
  selector: 'app-editor-terminal',
  imports: [EditorTerminalTabsComponent],
  templateUrl: './editor-terminal.component.html',
  styleUrl: './editor-terminal.component.css',
})
export class EditorTerminalComponent {

}
