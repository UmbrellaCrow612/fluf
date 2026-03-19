import {
  Component,
  ElementRef,
  inject,
  OnInit,
  signal,
  Type,
  viewChild,
} from '@angular/core';
import { ApplicationContextMenuService } from './services/application-context-menu.service';
import { NgComponentOutlet } from '@angular/common';

/**
 * Displays a geneirc context menu container which displays the current context menu component
 */
@Component({
  selector: 'app-application-context-menu',
  imports: [NgComponentOutlet],
  templateUrl: './application-context-menu.component.html',
  styleUrl: './application-context-menu.component.css',
})
export class ApplicationContextMenuComponent implements OnInit {
  private readonly applicationContextMenuService = inject(
    ApplicationContextMenuService,
  );

  /**
   * Refrence to the dialog template element
   */
  private readonly dialog =
    viewChild<ElementRef<HTMLDialogElement>>('contextMenu');

  /**
   * Holds loading state
   */
  public readonly isLoading = signal(false);

  /**
   * Holds error state
   */
  public readonly error = signal<string | null>(null);

  /**
   * Holds refrence to the component to render inside the context menu
   */
  public readonly componentToRender = signal<Type<any> | null>(null);

  ngOnInit() {
    this.init();
  }

  private init() {
    const info = this.applicationContextMenuService.getInformation();
    const dialog = this.dialog()?.nativeElement ?? null;

    try {
      if (!info.component || !info.event) {
        throw new Error('Did not pass a component or event');
      }

      if (!dialog) {
        throw new Error('Could not find dialog element');
      }

      this.componentToRender.set(info.component);

      dialog.addEventListener('close', () => {
        this.applicationContextMenuService.close();
      });

      dialog.addEventListener('click', (event) => {
        const rect = dialog.getBoundingClientRect();
        const isOutside =
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom;

        if (isOutside) {
          this.applicationContextMenuService.close();
        }
      });

      dialog.showModal();

      this.positionDialog(info.event, dialog);
    } catch (error: any) {
      console.error('Failed to initlize ', error);
      this.error.set(`Failed to initlize ${error?.message}`);
    } finally {
      this.isLoading.set(false);

      setTimeout(() => {
        this.positionDialog(info.event, dialog);
      }, 1);
    }
  }

  /**
   * Positions the dialog within the window so it doesn't go off it, if it does it will apply overflow styles so its content doesn't go off
   * @param event Which event triggered it (expects MouseEvent for positioning)
   * @param dialog The dialog to position
   */
  private positionDialog(
    event: Event | null,
    dialog: HTMLDialogElement | null,
  ): void {
    if (!event || !dialog) {
      return;
    }

    // Only handle mouse events for positioning
    if (!(event instanceof MouseEvent)) {
      return;
    }

    const mouseX = event.clientX;
    const mouseY = event.clientY;

    const dialogRect = dialog.getBoundingClientRect();
    const dialogWidth = dialogRect.width || dialog.offsetWidth;
    const dialogHeight = dialogRect.height || dialog.offsetHeight;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate ideal position (offset slightly from cursor)
    const offset = 8;
    let left = mouseX + offset;
    let top = mouseY + offset;

    // Check right edge overflow
    if (left + dialogWidth > viewportWidth) {
      left = mouseX - dialogWidth - offset;
    }

    // Check bottom edge overflow
    if (top + dialogHeight > viewportHeight) {
      top = mouseY - dialogHeight - offset;
    }

    // Ensure we don't go off the left/top edges
    left = Math.max(offset, left);
    top = Math.max(offset, top);

    // Apply positioning
    dialog.style.position = 'fixed';
    dialog.style.left = `${left}px`;
    dialog.style.top = `${top}px`;
    dialog.style.margin = '0'; // Remove default dialog margins

    // Handle overflow content if dialog is still too large for viewport
    const maxWidth = viewportWidth - left - offset;
    const maxHeight = viewportHeight - top - offset;

    if (dialogWidth > maxWidth || dialogHeight > maxHeight) {
      dialog.style.maxWidth = `${maxWidth}px`;
      dialog.style.maxHeight = `${maxHeight}px`;
      dialog.style.overflow = 'auto';
    }
  }
}
