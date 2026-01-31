import {
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  Type,
  viewChild,
} from '@angular/core';
import { ApplicationContextMenuService } from './application-context-menu.service';
import { ApplicationContextService } from '../context/application-context.service';
import { NgComponentOutlet } from '@angular/common';

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

    const dialog = this.dialog()?.nativeElement;
    if (!dialog) {
      throw new Error('No context menu dialog');
    }

    this.setupEventListeners(dialog);

    // Open dialog after component is set
    setTimeout(() => {
      const dialogEl = this.dialog();
      if (dialogEl) {
        dialogEl.nativeElement.showModal();
        this.positionDialog(dialogEl.nativeElement);
      }
    });
  }

  ngOnDestroy(): void {
    const dialog = this.dialog()?.nativeElement;
    if (!dialog) {
      return;
    }

    this.removeEventListeners(dialog);
  }

  /**
   * Setup event listeners for the dialog
   */
  private setupEventListeners(dialog: HTMLDialogElement): void {
    dialog.addEventListener('click', this.handleBackdropClick);
    dialog.addEventListener('close', this.handleDialogClose);
  }

  /**
   * Remove event listeners from the dialog
   */
  private removeEventListeners(dialog: HTMLDialogElement): void {
    dialog.removeEventListener('click', this.handleBackdropClick);
    dialog.removeEventListener('close', this.handleDialogClose);
  }

  /**
   * Handles when the dialog closes either through backdrop click or esc etc
   */
  private handleDialogClose = () => {
    this.applicationContextService.showContextMenu.set(false);
  };

  /**
   * Handle clicks on the backdrop (outside the dialog content)
   */
  private handleBackdropClick = (event: MouseEvent): void => {
    const dialog = event.target as HTMLDialogElement;
    const rect = dialog.getBoundingClientRect();

    // Check if click was outside the dialog bounds (on the backdrop)
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    ) {
      console.log('Clicked on backdrop');
      dialog.close();

      this.applicationContextService.showContextMenu.set(false)
    }
  };

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
