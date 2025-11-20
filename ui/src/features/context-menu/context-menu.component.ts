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
    if (!ctx) return;

    const mouseX = ctx.target.mouseX;
    const belowY = ctx.target.belowY;

    const dialogWidth = dialog.offsetWidth;
    const dialogHeight = dialog.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Preferred placement: below element, aligned with cursor X
    let left = mouseX;
    let top = belowY + 4; // 4px gap

    // --- Clamp X so it never goes off screen ---
    if (left + dialogWidth > viewportWidth) {
      left = viewportWidth - dialogWidth - 8; // margin
    }
    if (left < 8) left = 8;

    // --- Clamp Y so it never goes off bottom ---
    if (top + dialogHeight > viewportHeight) {
      // Place above the element if it wouldn't fit below
      top = belowY - dialogHeight - 8;
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
