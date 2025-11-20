import {
  Component,
  ElementRef,
  inject,
  OnInit,
  Type,
  viewChild,
} from '@angular/core';
import { InMemoryContextService } from '../app-context/app-in-memory-context.service';
import { NgComponentOutlet } from '@angular/common';

@Component({
  selector: 'app-context-menu',
  imports: [NgComponentOutlet],
  templateUrl: './context-menu.component.html',
  styleUrl: './context-menu.component.css',
})
export class ContextMenuComponent implements OnInit {
  private readonly inMemoryContextService = inject(InMemoryContextService);
  /**
   * The current data when the dialog is rendered
   */
  private readonly snapshot = this.inMemoryContextService.getSnapShot();

  /**
   * Ref to the dialog html element
   */
  private readonly dialogRef =
    viewChild<ElementRef<HTMLDialogElement>>('contextDialog');

  /**
   * List of all custom context menus to render in the dialog wrapper
   */
  elements: {
    /** The specific compponent to render */
    component: Type<any>;
    /** The callback that returns when it should be rendered based on a condition */
    condition: () => boolean;
  }[] = [];
  ngOnInit(): void {
    const dialog = this.dialogRef()!.nativeElement;

    this.positionDialog(dialog);

    dialog.showModal();

    dialog.addEventListener('click', (event) => {
      const rect = dialog.getBoundingClientRect();

      const isClickedOutside =
        event.clientY < rect.top ||
        event.clientY > rect.bottom ||
        event.clientX < rect.left ||
        event.clientX > rect.right;

      if (isClickedOutside) {
        dialog.close();
        this.inMemoryContextService.update('currentActiveContextMenu', null);
      }
    });
  }

  /**
   * Position the dialog using the SAFE rect data stored in context.
   */
  private positionDialog(dialog: HTMLDialogElement) {
    const ctx = this.snapshot.currentActiveContextMenu;
    if (!ctx?.target) return;

    const rect = ctx.target;

    const dialogWidth = dialog.offsetWidth;
    const dialogHeight = dialog.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Preferred: center horizontally below the target
    let left = rect.x + rect.width / 2 - dialogWidth / 2;
    let top = rect.y + rect.height + 4; // 4px gap

    // Keep inside viewport
    if (left < 8) left = 8;

    if (left + dialogWidth > viewportWidth) {
      left = viewportWidth - dialogWidth - 8;
    }

    // If overflow bottom → move above target
    if (top + dialogHeight > viewportHeight) {
      top = rect.y - dialogHeight - 4;
    }

    dialog.style.position = 'fixed';
    dialog.style.left = `${left}px`;
    dialog.style.top = `${top}px`;
  }

  /**
   * Checks if at least one element's condition is met.
   */
  get hasRenderableElements(): boolean {
    return this.elements.some((element) => element.condition());
  }

  /**
   * Checks if NONE of the elements' conditions are met.
   */
  get hasNoRenderableElements(): boolean {
    return !this.hasRenderableElements;
  }
}
