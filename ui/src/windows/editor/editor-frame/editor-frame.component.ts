import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Represents a item in the frame that is clickable and displays a menu of options
 */
type EditorFrameActionWithMenus  = {
  
}

/**
 * Acts as the frmae users can close, minimize and restore editor size as well as drag on with mouse
 */
@Component({
  selector: 'app-editor-frame',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './editor-frame.component.html',
  styleUrl: './editor-frame.component.css',
})
export class EditorFrameComponent {}
