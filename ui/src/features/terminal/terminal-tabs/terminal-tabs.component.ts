import { Component } from '@angular/core';
import { TerminalTabItemComponent } from "../terminal-tab-item/terminal-tab-item.component";
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltip } from "@angular/material/tooltip";

@Component({
  selector: 'app-terminal-tabs',
  imports: [TerminalTabItemComponent, MatButtonModule, MatIconModule, MatTooltip],
  templateUrl: './terminal-tabs.component.html',
  styleUrl: './terminal-tabs.component.css'
})
export class TerminalTabsComponent {

}
