import { Component, input, model, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type ContextMenuItem = {
  label: string;
  icon: string | undefined;
  disabled: boolean;
  keybinding:string | undefined
  clicked: voidCallback
};


@Component({
  selector: 'app-context-menu-item',
  imports: [MatIconModule],
  templateUrl: './context-menu-item.component.html',
  styleUrl: './context-menu-item.component.css',
})
export class ContextMenuItemComponent {
  /**
   * The text
   */
  label = input.required<string>();

  /**
   * Optional icon name - use mat icon names
   */
  icon = input<string | undefined>();

  /**
   * If the item should be disabled
   */
  disabled = model(false);

  /**
   * Optional for key binding text
   */
  keybinding = input<string | undefined>();

  /**
   * Emits a event when item is clicked and is not disabled
   */
  clicked = output<void>();
}
