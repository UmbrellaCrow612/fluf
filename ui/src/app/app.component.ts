import { Component, computed, inject, Signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApplicationContextMenuService } from '../shared/application-context-menu/services/application-context-menu.service';
import { ApplicationContextMenuComponent } from "../shared/application-context-menu/application-context-menu.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ApplicationContextMenuComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private readonly applicationContextMenuService = inject(
    ApplicationContextMenuService,
  );

  /**
   * Keeps track if it should show the application context menu component
   */
  public readonly displayContextMenu: Signal<boolean> = computed(() =>
    this.applicationContextMenuService.displayContextMenu(),
  );
}
