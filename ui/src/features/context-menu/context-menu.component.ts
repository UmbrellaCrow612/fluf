import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ContextService } from '../app-context/app-context.service';

@Component({
  selector: 'app-context-menu',
  imports: [],
  templateUrl: './context-menu.component.html',
  styleUrl: './context-menu.component.css',
})
export class ContextMenuComponent implements OnInit, OnDestroy {
  private readonly appContext = inject(ContextService)
  ngOnInit(): void {}

  ngOnDestroy(): void {
    // Clean up current active to be null
  }
}
