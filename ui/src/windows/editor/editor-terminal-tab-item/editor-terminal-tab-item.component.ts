import { Component, computed, input, signal, Signal } from '@angular/core';
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
  public label = input.required<string>();

  /**
   * Keeps track if the given terminal tab item is the active one
   */
  public isActive: Signal<boolean> = computed(() => false);

  /**
   * How long it takes for the parent tooltip to show
   */
  public tooltipShowDelay = signal(750);

  /**
   * Keeps track if the child is being hovered if so then the tooltip for parent will not be shown
   */
  public isHoveringChild = signal(false);

  /**
   * Runs when the child is hovered
   */
  public childHovered() {
    this.isHoveringChild.set(true);
    console.warn('in');
  }

  /**
   * Runs when the child hover mouse leaves
   */
  public childHoverLeave() {
    this.isHoveringChild.set(false);
    console.warn('out');
  }
}
