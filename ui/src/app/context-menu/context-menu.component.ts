import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ApplicationContextMenuService } from './application-context-menu.service';
import { ApplicationContextService } from '../context/application-context.service';

/**
 * Render the current active context menu into a dialog at the given position they requested =
 */
@Component({
  selector: 'app-context-menu',
  imports: [],
  templateUrl: './context-menu.component.html',
  styleUrl: './context-menu.component.css',
})
export class ContextMenuComponent implements OnInit, OnDestroy {
  private readonly applicationContextMenuService = inject(
    ApplicationContextMenuService,
  );
  private readonly applicationContextService = inject(ApplicationContextService);

  ngOnInit(): void {}

  ngOnDestroy(): void {}
}
