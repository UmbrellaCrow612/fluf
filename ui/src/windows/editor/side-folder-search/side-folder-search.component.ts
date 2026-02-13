import { Component, computed, inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { EditorContextService } from '../editor-context/editor-context.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { getElectronApi } from '../../../utils';
import { fsearchOptions, fsearchResult } from '../../../gen/type';

@Component({
  selector: 'app-side-folder-search',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
  ],
  templateUrl: './side-folder-search.component.html',
  styleUrl: './side-folder-search.component.css',
})
export class SideFolderSearchComponent {
  private readonly api = getElectronApi();
  private readonly contextService = inject(EditorContextService);
  private readonly selectedDir = computed(() =>
    this.contextService.selectedDirectoryPath(),
  );

  searchInputControl = new FormControl('', {
    validators: [Validators.required],
  });

  expandOptions = false;
  toggleOptions() {
    this.expandOptions = !this.expandOptions;
  }

  /**
   * Object used as two way binding
   */
  fosOptions: fsearchOptions = {
    ignoreCase: true,
    debug: false,
    depth: 0,
    limit: 0,
    open: false,
    partial: true,
    term: '',
    directory: this.selectedDir()!,
    type: 'folder',
  };

  results: fsearchResult[] = [];

  async submit(event: Event) {
    event.preventDefault();

    if (!this.searchInputControl.valid) {
      return;
    }

    this.results = await this.api.fsearchApi.search({
      ...this.fosOptions,
      term: this.searchInputControl.value!,
    });
  }
}
