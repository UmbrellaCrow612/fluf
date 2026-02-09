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
import { NgComponentOutlet } from '@angular/common';

/**
 * Render the current active context menu into a dialog at the given position they requested
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

    // Hide dialog initially
    dialog.style.opacity = '0';
    dialog.style.visibility = 'hidden';

    // Open dialog
    dialog.showModal();

    setTimeout(() => {
      this.positionDialog(dialog);

      // Show dialog after positioning
      dialog.style.opacity = '1';
      dialog.style.visibility = 'visible';
    }, 10);
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
    this.applicationContextMenuService.close();
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

      this.applicationContextMenuService.close();
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

    // Get the actual dimensions of the dialog content
    const rect = dialog.getBoundingClientRect();
    const dialogWidth = rect.width;
    const dialogHeight = rect.height;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = mouseX;
    let top = mouseY;

    // Check if dialog goes off screen horizontally
    if (left + dialogWidth > viewportWidth) {
      left = Math.max(10, viewportWidth - dialogWidth - 10); // 10px padding
    }

    // Ensure it doesn't go off the left edge
    left = Math.max(10, left);

    // Check if dialog goes off screen vertically
    if (top + dialogHeight > viewportHeight) {
      top = Math.max(10, viewportHeight - dialogHeight - 10); // 10px padding
    }

    // Ensure it doesn't go off the top edge
    top = Math.max(10, top);

    // Apply positioning with transform to avoid subpixel issues
    dialog.style.left = `${left}px`;
    dialog.style.top = `${top}px`;
    dialog.style.margin = '0';
    dialog.style.transform = 'none';

    // Handle overflow if dialog is too big for viewport
    const maxHeight = viewportHeight - top - 20; // 20px padding from bottom
    if (dialogHeight > maxHeight) {
      dialog.style.maxHeight = `${maxHeight}px`;
      dialog.style.overflowY = 'auto';
    }
  }
}
