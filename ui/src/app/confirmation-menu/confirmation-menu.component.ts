import {
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  viewChild,
} from '@angular/core';
import { ConfirmationService } from '../confirmation/confirmation.service';

/**
 * Displays when a user is asked for a confirmation
 */
@Component({
  selector: 'app-confirmation-menu',
  imports: [],
  templateUrl: './confirmation-menu.component.html',
  styleUrl: './confirmation-menu.component.css',
})
export class ConfirmationMenuComponent implements OnInit, OnDestroy {
  private readonly confirmationService = inject(ConfirmationService);

  ngOnInit(): void {
    let span = this.messageRef()?.nativeElement;
    if (!span) {
      console.error('Could not find span template element');
      return;
    }

    let textToRender = this.confirmationService.getMessage();
    if (textToRender) {
      span.innerText = textToRender;
    }

    // add event listners
  }

  ngOnDestroy(): void {}

  /**
   * Ref to template dialog
   */
  private readonly dialogRef =
    viewChild<ElementRef<HTMLDialogElement>>('confirmationDialog');

  /**
   * Ref to the span that will render the message
   */
  private readonly messageRef =
    viewChild<ElementRef<HTMLSpanElement>>('message');

  /**
   * Runs when the user clicks confirm, resolves the ask
   */
  confirm() {
    this.confirmationService.resolve(true)
  }

  /**
   * Runs when the user clicks cancel, rejects the ask
   */
  cancel(){
    this.confirmationService.reject("User clicked cancel")
  }
}
