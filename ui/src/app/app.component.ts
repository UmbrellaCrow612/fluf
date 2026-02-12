import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApplicationContextService } from './context/application-context.service';
import { ContextMenuComponent } from './context-menu/context-menu.component';
import { ConfirmationMenuComponent } from './confirmation-menu/confirmation-menu.component';
import { CommandServerService } from './command-server/command-server.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ContextMenuComponent, ConfirmationMenuComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  private readonly applicationContextService = inject(
    ApplicationContextService,
  );
  private readonly commandServerService = inject(CommandServerService);

  ngOnInit(): void {
    this.commandServerService.register();
  }

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
