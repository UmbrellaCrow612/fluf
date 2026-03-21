import { computed, Injectable, signal, Signal } from '@angular/core';

/**
 * Information about the current confirmation request.
 */
type RequestInformation = {
  /** The message to display in the confirmation dialog, or null if no request is active. */
  message: string | null;
};

/**
 * Handles confirmation dialogs when user input is needed to confirm or deny
 * certain actions before continuing. Displays a UI and resolves the promise
 * when the user accepts or denies the request.
 */
@Injectable({
  providedIn: 'root',
})
export class ApplicationConfirmationService {
  /** Internal signal tracking whether the confirmation dialog should be displayed. */
  private readonly _display = signal(false);

  /** Resolver function for the pending confirmation promise. */
  private _resolve: ((value: boolean | PromiseLike<boolean>) => void) | null =
    null;

  /** Rejection function for the pending confirmation promise. */
  private _reject: ((reason?: unknown) => void) | null = null;

  /** The message currently being displayed in the confirmation dialog. */
  private _message: string | null = null;

  /**
   * Exposes a read-only signal indicating whether the dialog should be displayed.
   */
  public readonly displayDialog: Signal<boolean> = computed(() =>
    this._display(),
  );

  /**
   * Displays a confirmation dialog UI that allows the user to accept or deny the request.
   * @param message - The message to display in the dialog.
   * @returns A promise that resolves to `true` if the user confirms, or `false` if they cancel.
   */
  public request(message: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.resetState();

      this._resolve = resolve;
      this._reject = reject;
      this._message = message;
      this._display.set(true);
    });
  }

  /**
   * Resets the internal state to its initial values.
   */
  private resetState(): void {
    this._reject = null;
    this._resolve = null;
    this._message = null;
    this._display.set(false);
  }

  /**
   * Resolves the pending confirmation request with the given value.
   * @param value - `true` if the user confirmed, `false` if they denied.
   */
  public resolveRequest(value: boolean): void {
    this._resolve?.(value);
    this.resetState();
  }

  /**
   * Rejects the pending confirmation request with the given reason.
   * @param reason - The reason for rejection.
   */
  public rejectRequest(reason: string): void {
    this._reject?.(reason);
    this.resetState();
  }

  /**
   * Gets information about the current confirmation request.
   * @returns An object containing the request message, or null if no request is active.
   */
  public getRequestInformation(): RequestInformation {
    return {
      message: this._message,
    };
  }
}
