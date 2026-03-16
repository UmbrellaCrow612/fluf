import { Component, OnInit } from '@angular/core';
import { EditorTerminalTabItemComponent } from '../editor-terminal-tab-item/editor-terminal-tab-item.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Holds the active tabs and allows crud operations on them
 */
@Component({
  selector: 'app-editor-terminal-tabs',
  imports: [
    EditorTerminalTabItemComponent,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './editor-terminal-tabs.component.html',
  styleUrl: './editor-terminal-tabs.component.css',
})
export class EditorTerminalTabsComponent implements OnInit {
  ngOnInit(): void {
   
  }
}
