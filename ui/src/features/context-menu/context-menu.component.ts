import {
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  Type,
  viewChild,
} from '@angular/core';
import { InMemoryContextService } from '../app-context/app-in-memory-context.service';
import { NgComponentOutlet } from '@angular/common';
import { FileExplorerFileNodeContextMenuComponent } from '../file-explorer/file-explorer-file-node-context-menu/file-explorer-file-node-context-menu.component';

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
  }[] = [
    {
      component: FileExplorerFileNodeContextMenuComponent,
      condition: () => {
        return (
          typeof this.snapshot.currentActiveContextMenu?.key == 'string' &&
          this.snapshot.currentActiveContextMenu?.key ==
            'file-explorer-file-node-context-menu'
        );
      },
    },
  ];

  ngOnInit(): void {
    const dialog = this.dialogRef()!.nativeElement;
    this.positionDialog(dialog);
    dialog.showModal();
    dialog.addEventListener('click', this.handleClickOutside);
  }

  private handleClickOutside = (event: MouseEvent) => {
    const dialog = this.dialogRef()!.nativeElement;
    const rect = dialog.getBoundingClientRect();
    const isClickedOutside =
      event.clientY < rect.top ||
      event.clientY > rect.bottom ||
      event.clientX < rect.left ||
      event.clientX > rect.right;

    if (isClickedOutside) {
      dialog.close();
      dialog.removeEventListener('click', this.handleClickOutside);
      this.inMemoryContextService.update('currentActiveContextMenu', null);
    }
  };

  /**
   * Position the dialog
   */
  private positionDialog(dialog: HTMLDialogElement) {
    const ctx = this.snapshot.currentActiveContextMenu;
    if (!ctx) return;

    const { mouseX, mouseY } = ctx.pos;

    let dialogWidth = dialog.offsetWidth;
    let dialogHeight = dialog.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Shrink if bigger than viewport
    if (dialogWidth > viewportWidth - 16) {
      dialogWidth = viewportWidth - 16;
      dialog.style.width = `${dialogWidth}px`;
    }
    if (dialogHeight > viewportHeight - 16) {
      dialogHeight = viewportHeight - 16;
      dialog.style.height = `${dialogHeight}px`;
      dialog.style.overflowY = 'auto'; // scroll if too tall
    }

    // Preferred placement: below mouse
    let left = mouseX;
    let top = mouseY + 4;

    // Clamp X to viewport
    left = Math.min(Math.max(left, 8), viewportWidth - dialogWidth - 8);

    // Clamp Y to viewport (place above if not enough space below)
    if (top + dialogHeight > viewportHeight - 8) {
      top = mouseY - dialogHeight - 4;
      if (top < 8) top = 8; // if still too high, clamp
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
