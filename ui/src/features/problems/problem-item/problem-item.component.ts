import { JsonPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { Diagnostic } from '@codemirror/lint';

/**
 * Render a files list of problems / diagnostics
 */
@Component({
  selector: 'app-problem-item',
  imports: [JsonPipe],
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
}
