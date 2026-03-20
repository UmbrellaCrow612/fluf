import {
  computed,
  inject,
  Injectable,
  signal,
  Signal,
  Type,
} from '@angular/core';

type ContextMenuInformation<T> = {
  /**
   * The component to render
   */
  component: Type<any> | null;

  /**
   * The event that triggered it
   */
  event: Event | null;

  /**
   * The data passed to it
   */
  data: T | null;
};

/**
 * Handles application wide context menu rendering
 */
@Injectable({
  providedIn: 'root',
})
export class ApplicationContextMenuService {
  private _component: Type<any> | null = null;
  private _event: Event | null = null;
  private _data: unknown | null = null;
  private readonly _display = signal(false);

  /**
   * Open the application context menu and render a custom component inside of it
   * @param component The inner component to render inside the generic context menu component
   * @param event The event that triggered it
   * @param [data=null] Data to pass to the context menu
   */
  public open<T>(
    component: Type<any>,
    event: Event,
    data: T | null = null,
  ): void {
    this.resetState();

    this._component = component;
    this._event = event;
    this._data = data;
    this._display.set(true);
  }

  /**
   * Closes the application context menu
   */
  public close() {
    this.resetState();
  }

  /**
   * Resets state to defaults
   */
  private resetState() {
    this._component = null;
    this._event = null;
    this._data = null;
    this._display.set(false);
  }

  /**
   * Gte the information given to the context menu
   * @returns Object containg information for the application context menu to use
   */
  public getInformation<T>(): ContextMenuInformation<T> {
    return {
      data: this._data as T,
      component: this._component,
      event: this._event,
    };
  }

  /**
   * Keeps track if the context menus should be rendered in the UI
   */
  public readonly displayContextMenu: Signal<boolean> = computed(() =>
    this._display(),
  );
}
