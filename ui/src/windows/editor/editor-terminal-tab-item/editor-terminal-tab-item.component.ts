import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-editor-terminal-tab-item',
  imports: [MatIconModule],
  templateUrl: './editor-terminal-tab-item.component.html',
  styleUrl: './editor-terminal-tab-item.component.css',
})
export class EditorTerminalTabItemComponent {
  /**
   * Text to render in the tab item
   */
  public label = input.required<string>()
}
