import { Component, DestroyRef, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ContextService } from '../../app-context/app-context.service';

@Component({
  selector: 'app-terminal-tab-item',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './terminal-tab-item.component.html',
  styleUrl: './terminal-tab-item.component.css',
})
export class TerminalTabItemComponent {
  private readonly appContext = inject(ContextService);
  private readonly destroyRef = inject(DestroyRef);
  /**
   * Label of the terminal session
   */
  label = input.required<string>();

  /**
   * Indicates if the current terminal is the active one
   */
  isActive = true;
}
