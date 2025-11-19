import { Component, inject } from '@angular/core';
import { ContextService } from '../app-context/app-context.service';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { JsonPipe } from '@angular/common';
import { getElectronApi } from '../../utils';

@Component({
  selector: 'app-side-file-search',
  imports: [ReactiveFormsModule, JsonPipe],
  templateUrl: './side-file-search.component.html',
  styleUrl: './side-file-search.component.css',
})
export class SideFileSearchComponent {
  private readonly appContext = inject(ContextService);
  private readonly selectedDir =
    this.appContext.getSnapshot().selectedDirectoryPath;
  private readonly api = getElectronApi();

  showOptions = false;

  searchFormOptions = new FormGroup({
    term: new FormControl('', {
      validators: [Validators.required],
    }),
    partial: new FormControl(false),
    ignoreCase: new FormControl(false),
    open: new FormControl(false),
    limit: new FormControl(0),
    depth: new FormControl(0),

    /** string[] are set as strings via ui they need to be normalized into string[] via a split , on submit*/
    ext: new FormControl<string[] | null>(null),
    excludeExt: new FormControl<string[] | null>(null),
    excludeDir: new FormControl<string[] | null>(null),
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

  /**
   * Runs logic to search with fsearch
   */
  async search(event: Event) {
    event.preventDefault();

    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    let res = await this.api.fsearch(undefined, {
      directory: this.selectedDir!,
      term: this.searchFormOptions.controls.term.value!,
      partial: true,
      ignoreCase: true
    });

    this.isSubmitting = false;

    console.log(JSON.stringify(res));
  }
}
