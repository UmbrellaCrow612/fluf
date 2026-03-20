import { Component, inject, OnInit } from '@angular/core';
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

  ngOnInit(): void {
  }
}
