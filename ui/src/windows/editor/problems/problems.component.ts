import { Component, inject, computed } from '@angular/core';
import { EditorInMemoryContextService } from '../editor-context/editor-in-memory-context.service';
import { ProblemItemComponent } from './problem-item/problem-item.component';
import { Diagnostic } from '@codemirror/lint';

@Component({
  selector: 'app-problems',
  imports: [ProblemItemComponent],
  templateUrl: './problems.component.html',
  styleUrl: './problems.component.css',
})
export class ProblemsComponent {
  private readonly inMemoryContextService = inject(EditorInMemoryContextService);

  files = computed(() =>
    Array.from(this.inMemoryContextService.problems().keys()),
  );

  /**
   * Factory that returns computed signals
   */
  diagnosticsForFile(filePath: string) {
    return computed<Diagnostic[]>(() => {
      const fileMap = this.inMemoryContextService.problems().get(filePath);
      if (!fileMap) return [];

      return Array.from(fileMap.values()).flat();
    });
  }

  hasFilesButNoDiagnostics = computed(() => {
    const allFiles = this.files();
    if (allFiles.length === 0) return false;

    return allFiles.every(
      (file) => this.diagnosticsForFile(file)().length === 0,
    );
  });
}
