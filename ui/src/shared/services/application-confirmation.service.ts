import { computed, Injectable, signal, Signal } from '@angular/core';

type RequestInformation = {
  message: string | null;
};

/**
 * Handles confirmation, when user input is needed to confirm or deny certain actions beofre continuing, will display a UI and resolve promise when user accepts or denys
 */
@Injectable({
  providedIn: 'root',
})
export class ApplicationConfirmationService {
  private readonly _display = signal(false);
  private _resolve: ((value: boolean | PromiseLike<boolean>) => void) | null =
    null;
  private _reject: ((reason?: any) => void) | null = null;
  private _message: string | null = null;

  /**
   * Exposes a read only signal to dialog or not
   */
  public readonly displayDialog: Signal<boolean> = computed(() =>
    this._display(),
  );

  /**
   * Displays a dialog UI which allows user to accept or deny the request
   * @param content The message to display
   * @returns Promise that awaits user to click confirm or cancel that can be awaited in the code
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

  private resetState() {
    this._reject = null;
    this._resolve = null;
    this._message = null;
    this._display.set(false);
  }

  public resolveRequest(value: boolean) {
    this._resolve?.(value);
  }

  public rejectRequest() {
    this._reject?.();
  }

  public getRequestInformation(): RequestInformation {
    return {
      message: this._message,
    };
  }
}
