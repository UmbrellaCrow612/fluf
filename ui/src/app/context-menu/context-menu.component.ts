import {
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  Signal,
  signal,
  Type,
  viewChild,
} from '@angular/core';
import { ApplicationContextMenuService } from './application-context-menu.service';
import { ApplicationContextService } from '../context/application-context.service';
import { NgComponentOutlet } from '../../../node_modules/@angular/common/types/_common_module-chunk';

/**
 * Render the current active context menu into a dialog at the given position they requested =
 */
@Component({
  selector: 'app-context-menu',
  imports: [NgComponentOutlet],
  templateUrl: './context-menu.component.html',
  styleUrl: './context-menu.component.css',
})
export class ContextMenuComponent implements OnInit, OnDestroy {
  private readonly applicationContextMenuService = inject(
    ApplicationContextMenuService,
  );
  private readonly applicationContextService = inject(
    ApplicationContextService,
  );

  /** Ref to the dialog */
  private dialog =
    viewChild<ElementRef<HTMLDialogElement>>('contextMenuDialog');

  /** Holds the component we will render in the UI */
  componentToRender = signal<Type<any> | null>(null);

  ngOnInit(): void {
    this.componentToRender.set(
      this.applicationContextMenuService.getContextMenuComponentToRender(),
    );

    // Open dialog after component is set
    setTimeout(() => {
      const dialogEl = this.dialog();
      if (dialogEl) {
        dialogEl.nativeElement.showModal();
        this.positionDialog(dialogEl.nativeElement);
      }
    });
  }

  ngOnDestroy(): void {}

  /**
   * Position the dialog at the specified mouse coordinates and handle overflow
   */
  private positionDialog(dialog: HTMLDialogElement): void {
    const position =
      this.applicationContextMenuService.getContextMenuPosition();
    if (!position) return;

    const { mouseX, mouseY } = position;
    const rect = dialog.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = mouseX;
    let top = mouseY;

    // Check if dialog goes off screen horizontally
    if (left + rect.width > viewportWidth) {
      left = viewportWidth - rect.width - 10; // 10px padding
    }

    // Ensure it doesn't go off the left edge
    if (left < 0) {
      left = 10;
    }

    // Check if dialog goes off screen vertically
    if (top + rect.height > viewportHeight) {
      top = viewportHeight - rect.height - 10; // 10px padding
    }

    // Ensure it doesn't go off the top edge
    if (top < 0) {
      top = 10;
    }

    // Apply positioning
    dialog.style.left = `${left}px`;
    dialog.style.top = `${top}px`;

    // Handle overflow if dialog is too big for viewport
    const maxHeight = viewportHeight - top - 20; // 20px padding
    if (rect.height > maxHeight) {
      dialog.style.maxHeight = `${maxHeight}px`;
      dialog.style.overflowY = 'auto';
    }
  }
}
