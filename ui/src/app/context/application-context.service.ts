import { Injectable, signal } from '@angular/core';

/**
 * Refers to application-level context—i.e., data not bound to a single window’s logic
 * but to the app component itself. Each window is its own contained instance of the app,
 * but sometimes we need shared logic for app-wide features—for example, a generic context
 * menu strategy used by all windows.
 *
 * This is typically used for features or behaviors that are not window-specific but
 * app-specific, such as generic utilities shared across windows.
 *
 * NOT PERSISTED — LIVES ONLY IN MEMORY (until a refresh).
 *
 * SHOULD NOT DEPEND ON ANY OTHER SERVICE.
 */
@Injectable({
  providedIn: 'root',
})
export class ApplicationContextService {
  /**
   * Indicates whether the generic context menu should be shown.
   */
  readonly showContextMenu = signal(false);

  /**
   * Indicates if the generic confirmation menu should be shown
   */
  readonly showConfirmationMenu = signal(false);
}
