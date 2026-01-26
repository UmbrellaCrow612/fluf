import { Component, computed, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SideSearchItemComponent } from './side-search-item/side-search-item.component';
import { getElectronApi } from '../../utils';
import { EditorContextService } from '../app-context/editor-context.service';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ripGrepResult } from '../../gen/type';

@Component({
  selector: 'app-side-search',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule,
    SideSearchItemComponent,
  ],
  templateUrl: './side-search.component.html',
  styleUrl: './side-search.component.css',
})
export class SideSearchComponent {
  private readonly api = getElectronApi();
  private readonly appContext = inject(EditorContextService);
  private searchDir = computed(() => this.appContext.selectedDirectoryPath());

  showExtraSearchOptions = false;

  searchTermInputControl = new FormControl('', {
    validators: [Validators.required],
  });
  includeTermInputControl = new FormControl(null);
  excludeTermInputControl = new FormControl(null);

  ripGrepResult: ripGrepResult[] = [];

  get totalResults(): number {
    return this.ripGrepResult.reduce((sum, file) => sum + file.lines.length, 0);
  }

  get totalFiles(): number {
    return this.ripGrepResult.length;
  }

  toggleExtraSearchOptions() {
    this.showExtraSearchOptions = !this.showExtraSearchOptions;
  }

  /**
   * Runs when want to search dir for term
   */
  async search(event: Event) {
    event.preventDefault();
    if (!this.searchTermInputControl.valid) {
      return;
    }

    let term = this.searchTermInputControl.value!;
    let exclude = this.excludeTermInputControl.value ?? undefined;
    let include = this.includeTermInputControl.value ?? undefined;

    this.ripGrepResult = await this.api.ripgrepApi.search({
      searchTerm: term,
      searchPath: this.searchDir()!,
      caseInsensitive: true,
      excludes: exclude,
      includes: include,
    });
  }
}
