import { inject, Injectable } from '@angular/core';
import { contextMenuActiveElement } from '../app-context/type';
import { ContextService } from '../app-context/app-context.service';

/**
 * Provides a API to trigger the context menu and what context menu to trigger
 */
@Injectable({
  providedIn: 'root',
})
export class ContextMenuService {
  private readonly appContext = inject(ContextService);

  /**
   * Open a context menu
   * @param key The specific ctx menu to open
   * @param event The trigger event, used for x and y position
   * @param data Any data you want to pass to it
   */
  open(key: contextMenuActiveElement, event: MouseEvent, data = null) {
    event.preventDefault();

    this.appContext.update('currentActiveContextMenu', {
      data: data,
      key: key,
      pos: { x: event.clientX, y: event.clientY },
    });
  }
}
