import { Component, computed, inject } from '@angular/core';
import { ContextService } from '../app-context/app-context.service';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { getElectronApi } from '../../utils';
import { fsearchOptions, fsearchResult } from '../../gen/type';

@Component({
  selector: 'app-side-file-search',
  imports: [ReactiveFormsModule],
  templateUrl: './side-file-search.component.html',
  styleUrl: './side-file-search.component.css',
})
export class SideFileSearchComponent {
  private readonly appContext = inject(ContextService);
  private readonly selectedDir = computed(() =>
    this.appContext.selectedDirectoryPath(),
  );
  private readonly api = getElectronApi();

  showOptions = false;

  searchFormOptions = new FormGroup({
    term: new FormControl('', {
      validators: [Validators.required],
    }),
    partial: new FormControl(true),
    ignoreCase: new FormControl(true),
    open: new FormControl(false),
    limit: new FormControl(0),
    depth: new FormControl(0),

    /** set as plain string sbut need to be normalised to string[] split via , */
    ext: new FormControl<string | null>(null),
    excludeExt: new FormControl<string | null>(null),
    excludeDir: new FormControl<string | null>('node_modules,bin'),
    /** */

    minSize: new FormControl(0),
    maxSize: new FormControl(0),
    sizeType: new FormControl<'B' | 'KB'>('B'),

    modifiedBefore: new FormControl(''),
    modifiedAfter: new FormControl(''),

    hidden: new FormControl(false),
    count: new FormControl(false),
    regex: new FormControl(false),
  });

  isSubmitting = false;

  results: fsearchResult[] = [];

  /**
   * Runs logic to search with fsearch
   */
  async search(event: Event) {
    event.preventDefault();

    if (this.isSubmitting || this.searchFormOptions.invalid) return;

    this.isSubmitting = true;

    const form = this.searchFormOptions.controls;

    const normalizeArray = (value: string[] | string | null | undefined) => {
      if (!value) return undefined;

      if (Array.isArray(value)) {
        return value
          .map((v) => v.split(','))
          .flat()
          .map((v) => v.trim())
          .filter((v) => v.length > 0);
      }

      if (typeof value === 'string') {
        return value
          .split(',')
          .map((v) => v.trim())
          .filter((v) => v.length > 0);
      }

      return undefined;
    };

    const options: fsearchOptions = {
      directory: this.selectedDir()!,
      term: form.term.value!,
      partial: form.partial.value!,
      ignoreCase: form.ignoreCase.value!,
      open: form.open.value!,
      lines: undefined,
      limit: form.limit.value || undefined,
      depth: form.depth.value || undefined,
      ext: normalizeArray(form.ext.value),
      excludeExt: normalizeArray(form.excludeExt.value),
      excludeDir: normalizeArray(form.excludeDir.value),
      minSize: form.minSize.value || undefined,
      maxSize: form.maxSize.value || undefined,
      sizeType: form.sizeType.value!,
      modifiedBefore: form.modifiedBefore.value || undefined,
      modifiedAfter: form.modifiedAfter.value || undefined,
      hidden: form.hidden.value!,
      count: form.count.value!,
      regex: form.regex.value!,
    };

    try {
      this.results = await this.api.fsearchApi.search(options);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      this.isSubmitting = false;
    }
  }
}
