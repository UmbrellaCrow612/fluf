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
    this.dialogRef()?.nativeElement.showModal();
    this.dialogRef()?.nativeElement.addEventListener('click', (event) => {
      const rect = this.dialogRef()!.nativeElement.getBoundingClientRect();

      const isClickedOutside =
        event.clientY < rect.top ||
        event.clientY > rect.bottom ||
        event.clientX < rect.left ||
        event.clientX > rect.right;

      if (isClickedOutside) {
        this.dialogRef()!.nativeElement.close();
        this.inMemoryContextService.update('currentActiveContextMenu', null);
      }
    });
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
