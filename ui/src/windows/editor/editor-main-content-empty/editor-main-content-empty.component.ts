import { Component } from '@angular/core';

/**
 * Displays an empty state in the main content area when no file is selected.
 *
 * This component serves as:
 * - A home screen / landing view when the application loads
 * - A placeholder when no main content element is active
 *
 * Typically shown when:
 * - No file is currently selected
 * - The main content area would otherwise be null/empty
 */
@Component({
  selector: 'app-editor-main-content-empty',
  imports: [],
  templateUrl: './editor-main-content-empty.component.html',
  styleUrl: './editor-main-content-empty.component.css',
})
export class EditorMainContentEmptyComponent {}
