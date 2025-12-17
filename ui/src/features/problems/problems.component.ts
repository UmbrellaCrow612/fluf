import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { InMemoryContextService } from '../app-context/app-in-memory-context.service';
import { Diagnostic } from '@codemirror/lint';
import { ProblemItemComponent } from './problem-item/problem-item.component';

@Component({
  selector: 'app-problems',
  imports: [ProblemItemComponent],
  templateUrl: './problems.component.html',
  styleUrl: './problems.component.css',
})
export class ProblemsComponent implements OnInit {
  private readonly inMemoryContextService = inject(InMemoryContextService);
  private readonly destroyRef = inject(DestroyRef);

  problems: Map<string, Map<string, Diagnostic[]>> =
    this.inMemoryContextService.getSnapShot().problems;

  ngOnInit(): void {
    this.inMemoryContextService.autoSub(
      'problems',
      (ctx) => {
        this.problems = ctx.problems;
      },
      this.destroyRef
    );
  }

  getFiles(): string[] {
    return Array.from(this.problems.keys());
  }

  getDiagnosticsForFile(filePath: string): Diagnostic[] {
    let m = this.problems.get(filePath);
    if (!m) return [];

    return Array.from(m.values()).flat();
  }
}
