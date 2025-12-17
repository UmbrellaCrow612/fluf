import { Component, input, OnInit } from '@angular/core';
import { Diagnostic } from '@codemirror/lint';

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
  diagnostics = input.required<Diagnostic[]>();

  /**
   * Whether the child diagnostics are collapsed
   */
  collapsed = false;

  toggleCollapse() {
    this.collapsed = !this.collapsed;
  }
}
