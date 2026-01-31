import { inject, Injectable, Type } from '@angular/core';
import { ApplicationContextService } from '../context/application-context.service';

type Position = {
  mouseX: number;
  mouseY: number;
};

/**
 * Used as a way to show context menus i.e right click menus in the application in a generic way
 */
@Injectable({
  providedIn: 'root',
})
export class ApplicationContextMenuService {
  private readonly applicationContextService = inject(
    ApplicationContextService,
  );

  /** The specific component to render */
  private contextMenuComponent: Type<any> | null = null;

  /** The position at which the mouse right clicked */
  private position: Position | null = null;

  /** Any data they want to pass to the context menu */
  private data: any = null;

  /**
   * Get the component to render in the context menu
   * @returns The specific component to render
   */
  getContextMenuComponentToRender(): Type<any> | null {
    return this.contextMenuComponent;
  }

  /** The the position at which to render the context menu */
  getContextMenuPosition(): Position | null {
    return this.position;
  }

  /**
   * Gets the data passed for the context menu
   */
  getContextMenuData(): any {
    return this.data;
  }

  /**
   * Show a context menu in the application
   * @param contextMenuComponent The specific context menu component to show
   */
  open(contextMenuComponent: Type<any>, position: Position, data: any = null) {
    this.applicationContextService.showContextMenu.update((x) => !x);

    this.contextMenuComponent = contextMenuComponent;
    this.position = position;
    this.data = data;
  }

  /**
   * The the context menu if it is open
   */
  close() {
    this.applicationContextService.showContextMenu.set(false);
  }
}
