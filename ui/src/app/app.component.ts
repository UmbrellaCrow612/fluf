import { Component, computed, inject, Signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApplicationContextMenuService } from '../shared/services/application-context-menu.service';
import { ApplicationContextMenuComponent } from '../shared/application-context-menu/application-context-menu.component';
import { ApplicationConfirmationService } from '../shared/services/application-confirmation.service';
import { ApplicationConfirmationComponent } from "../shared/application-confirmation/application-confirmation.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ApplicationContextMenuComponent, ApplicationConfirmationComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private readonly applicationContextMenuService = inject(
    ApplicationContextMenuService,
  );
  private readonly applicationConfirmationService = inject(
    ApplicationConfirmationService,
  );

  /**
   * Keeps track if it should show the application context menu component
   */
  public readonly displayContextMenu: Signal<boolean> = computed(() =>
    this.applicationContextMenuService.displayContextMenu(),
  );

  /**
   * Keeps track if it should show the confirmation dialog
   */
  public readonly displayConfirmationMenu: Signal<boolean> = computed(() =>
    this.applicationConfirmationService.displayDialog(),
  );
}
