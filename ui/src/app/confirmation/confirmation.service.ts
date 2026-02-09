import { inject, Injectable } from '@angular/core';
import { ApplicationContextService } from '../context/application-context.service';

/**
 * Used for confirmation of a user action, displays a model with confirm and cancel
 */
@Injectable({
  providedIn: 'root',
})
export class ConfirmationService {
  private readonly applicationContextService = inject(
    ApplicationContextService,
  );

  /**
   * Ask the user via a modal if they want to confirm the action pressing / closing the modal resolves the promise
   * @param [message=null] A optional message for what this action is asking for
   * @returns A promise that resolves to true or false based on what the user clicked
   */
  ask(message: string | null = null): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this._reject = reject;
      this._resolve = resolve;
      this._message = message;

      this.applicationContextService.showConfirmationMenu.set(true);
    });
  }

  /**
   * Holds the message to render in the modal
   */
  private _message: string | null = null;

  /**
   * Used to resolve the promise of the caller who asked
   */
  private _resolve: ((value: boolean | PromiseLike<boolean>) => void) | null =
    null;

  /**
   * Used to reject the promise of the caller who asked
   */
  private _reject: ((reason?: any) => void) | null = null;

  /**
   * Sets state to default
   */
  private cleanState() {
    this.applicationContextService.showConfirmationMenu.set(false);
    this._message = null;
    this._reject = null;
    this._resolve = null;
  }

  /**
   * Used to reject the confirmation request
   */
  public reject(reason: any) {
    if (this._reject) {
      this._reject(reason);
    }

    this.cleanState();
  }

  /**
   * Used to resolve the confirmation request
   */
  public resolve(value: boolean) {
    if (this._resolve) {
      this._resolve(value);
    }

    this.cleanState();
  }

  /**
   * Gets the message to render in the confirmation modal
   */
  public getMessage() {
    return this._message;
  }
}
