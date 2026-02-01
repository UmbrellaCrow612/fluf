import { Component, input } from '@angular/core';

@Component({
  selector: 'app-context-menu-item',
  imports: [],
  templateUrl: './context-menu-item.component.html',
  styleUrl: './context-menu-item.component.css',
})
export class ContextMenuItemComponent {


  /**
   * Context menu item label that displays in the button
   */
  label = input.required<string>();
}
