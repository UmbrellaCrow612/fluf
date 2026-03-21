import {
  Component,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { ApplicationConfirmationService } from '../services/application-confirmation.service';

/**
 * Displays a dialog for confirmation requests
 */
@Component({
  selector: 'app-application-confirmation',
  imports: [],
  templateUrl: './application-confirmation.component.html',
  styleUrl: './application-confirmation.component.css',
})
export class ApplicationConfirmationComponent implements OnInit {
  private readonly applicationConfirmationService = inject(
    ApplicationConfirmationService,
  );

  /**
   * Holds refrence to the dialog in the template
   */
  private readonly dialog =
    viewChild<ElementRef<HTMLDialogElement>>('confirmationDialog');

  /**
   * Holds a refrence to the span in the template
   */
  private readonly messageSpan =
    viewChild<ElementRef<HTMLSpanElement>>('message');

  /**
   * Holds the information passed to the confirmation dialog
   */
  private readonly information =
    this.applicationConfirmationService.getRequestInformation();

  ngOnInit() {
    if (!this.information.message) {
      this.applicationConfirmationService.rejectRequest(
        'Did not pass any information to dialog',
      );
      return;
    }

    const dialog = this.dialog()?.nativeElement;
    if (!dialog) {
      this.applicationConfirmationService.rejectRequest(
        'Could not find HTML dialog element',
      );
      return;
    }

    const span = this.messageSpan()?.nativeElement;
    if (!span) {
      this.applicationConfirmationService.rejectRequest(
        'Could not find message span',
      );
      return;
    }

    this.showConfirmationDialog(dialog, span);
  }

  /**
   * Confirm the users choice and notify the asker of there choice
   * @param value If it was accepted / canceled
   */
  public confirm(value: boolean) {
    this.applicationConfirmationService.resolveRequest(value);
  }

  private showConfirmationDialog(
    dialog: HTMLDialogElement,
    messageSpan: HTMLSpanElement,
  ) {
    dialog.showModal();

    dialog.addEventListener('close', () => {
      this.applicationConfirmationService.resolveRequest(false);
    });

    messageSpan.innerText = this.information?.message ?? 'undefined';
  }
}
