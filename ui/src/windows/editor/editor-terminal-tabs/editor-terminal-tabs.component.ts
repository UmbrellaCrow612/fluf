import { Component } from '@angular/core';
import { EditorTerminalTabItemComponent } from "../editor-terminal-tab-item/editor-terminal-tab-item.component";

/**
 * Holds the active tabs and allows crud operations on them
 */
@Component({
  selector: 'app-editor-terminal-tabs',
  imports: [EditorTerminalTabItemComponent],
  templateUrl: './editor-terminal-tabs.component.html',
  styleUrl: './editor-terminal-tabs.component.css',
})
export class EditorTerminalTabsComponent {

}
