import { Component, inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { getElectronApi } from '../../utils';
import { ContextService } from '../app-context/app-context.service';

@Component({
  selector: 'app-side-folder-search',
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './side-folder-search.component.html',
  styleUrl: './side-folder-search.component.css',
})
export class SideFolderSearchComponent {
  private readonly api = getElectronApi();
  private readonly contextService = inject(ContextService);
  private readonly selectedDir =
    this.contextService.getSnapshot().selectedDirectoryPath;

  searchInputControl = new FormControl('', {
    validators: [Validators.required],
  });

  expandOptions = true;

  /**
   * Object used as two way binding
   */
  fosOptions: fosOptions = {
    caseInsensitive: true,
    countOnly: false,
    debug: false,
    depth: 0,
    exclude: [],
    includeHidden: false,
    limit: 0,
    open: false,
    partial: true,
    preview: false,
    sort: 'name',
  };

  async submit(event: Event) {
    event.preventDefault();

    if (!this.searchInputControl.valid) {
      return;
    }

    let results = await this.api.fos(
      undefined,
      this.searchInputControl.value!,
      this.selectedDir!,
      {
        caseInsensitive: true,
        partial: true,
      }
    );

    console.log(results);
  }
}
