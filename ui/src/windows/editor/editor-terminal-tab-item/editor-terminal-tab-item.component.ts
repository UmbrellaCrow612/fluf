import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-editor-terminal-tab-item',
  imports: [MatIconModule, MatTooltipModule],
  templateUrl: './editor-terminal-tab-item.component.html',
  styleUrl: './editor-terminal-tab-item.component.css',
})
export class EditorTerminalTabItemComponent {
  /**
   * Text to render in the tab item
   */
  public label = input.required<string>()
}
