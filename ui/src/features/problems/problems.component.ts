import { Component, DestroyRef, inject, OnInit, signal, computed } from '@angular/core';
import { InMemoryContextService } from '../app-context/app-in-memory-context.service';
import { ProblemItemComponent } from './problem-item/problem-item.component';
import { FlufDiagnostic } from '../diagnostic/type';

@Component({
  selector: 'app-problems',
  imports: [ProblemItemComponent],
  templateUrl: './problems.component.html',
  styleUrl: './problems.component.css',
})
export class ProblemsComponent implements OnInit {
  private readonly inMemoryContextService = inject(InMemoryContextService);
  private readonly destroyRef = inject(DestroyRef);

  problems = signal<Map<string, Map<string, FlufDiagnostic[]>>>(
    this.inMemoryContextService.getSnapShot().problems
  );

  hasFilesButNoDiagnostics = computed(() => {
    const problemsMap = this.problems();
    
    if (problemsMap.size === 0) {
      return false;
    }

    for (const filePath of problemsMap.keys()) {
      const diagnostics = this.getDiagnosticsForFile(filePath);
      if (diagnostics.length > 0) {
        return false;
      }
    }

    return true;
  });

  ngOnInit(): void {
    this.inMemoryContextService.autoSub(
      'problems',
      (ctx) => {
        this.problems.set(ctx.problems);
      },
      this.destroyRef
    );
  }

  getFiles(): string[] {
    return Array.from(this.problems().keys());
  }

  getDiagnosticsForFile(filePath: string): FlufDiagnostic[] {
    let m = this.problems().get(filePath);
    if (!m) return [];

    return Array.from(m.values()).flat();
  }
}