import { Component, input } from '@angular/core';
import { FlufDiagnostic } from '../../diagnostic/type';

/**
 * Render a files list of problems / diagnostics
 */
@Component({
  selector: 'app-problem-item',
  imports: [],
  templateUrl: './problem-item.component.html',
  styleUrl: './problem-item.component.css',
})
export class ProblemItemComponent {
  /**
   * The file path
   */
  filePath = input.required<string>();

  /**
   * All the diagnostics put together for this file
   */
  diagnostics = input.required<FlufDiagnostic[]>();

  /**
   * Whether the child diagnostics are collapsed
   */
  collapsed = false;

  toggleCollapse() {
    this.collapsed = !this.collapsed;
  }

  /**
   * Format line and column information for display
   */
  getLineInfo(diagnostic: FlufDiagnostic): string {
    const start = `${diagnostic.startLine}:${diagnostic.startColumn}`;

    // Only show end position if it's different from start
    if (
      diagnostic.endLine !== diagnostic.startLine ||
      diagnostic.endColumn !== diagnostic.startColumn
    ) {
      return `[${start} - ${diagnostic.endLine}:${diagnostic.endColumn}]`;
    }

    return `[${start}]`;
  }
}
