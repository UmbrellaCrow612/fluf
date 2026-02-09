import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApplicationContextService } from './context/application-context.service';
import { ContextMenuComponent } from './context-menu/context-menu.component';
import { ConfirmationMenuComponent } from "./confirmation-menu/confirmation-menu.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ContextMenuComponent, ConfirmationMenuComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private readonly applicationContextService = inject(
    ApplicationContextService,
  );

  /**
   * Keeps track if it should show the generic context menu
   */
  shouldShowContextMenu = computed(() =>
    this.applicationContextService.showContextMenu(),
  );

  /**
   * Keeps track if it should show the generic confirmation menu
   */
  showShowConfirmationMenu = computed(() =>
    this.applicationContextService.showConfirmationMenu(),
  );
}
