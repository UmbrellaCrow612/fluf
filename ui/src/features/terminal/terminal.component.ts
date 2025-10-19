import { Component } from '@angular/core';
import { TerminalTabsComponent } from "./terminal-tabs/terminal-tabs.component";
import { TerminalEditorComponent } from "./terminal-editor/terminal-editor.component";

@Component({
  selector: 'app-terminal',
  imports: [TerminalTabsComponent, TerminalEditorComponent],
  templateUrl: './terminal.component.html',
  styleUrl: './terminal.component.css'
})
export class TerminalComponent {

}
