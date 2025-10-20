import { Component, DestroyRef, inject, input, OnInit } from '@angular/core';
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
export class TerminalTabItemComponent implements OnInit {
  private readonly appContext = inject(ContextService);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Label of the terminal session
   */
  terminal = input.required<terminalInformation>();

  /**
   * Indicates if the current terminal is the active one
   */
  isActive: boolean = false;

  ngOnInit(): void {
    let init = this.appContext.getSnapshot();

    this.isActive = init.currentActiveTerminald === this.terminal().id;

    this.appContext.autoSub(
      'currentActiveTerminald',
      (ctx) => {
        this.isActive = ctx.currentActiveTerminald === this.terminal().id;
      },
      this.destroyRef
    );
  }

  terminalClicked() {
    this.appContext.update('currentActiveTerminald', this.terminal().id);
  }
}
