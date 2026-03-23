import {
  Component,
  computed,
  inject,
  OnInit,
  Signal,
  signal,
} from '@angular/core';
import { EditorInMemoryStateService } from '../core/state/editor-in-memory-state.service';
import { getElectronApi } from '../../../shared/electron';

@Component({
  selector: 'app-editor-footer',
  imports: [],
  templateUrl: './editor-footer.component.html',
  styleUrl: './editor-footer.component.css',
})
export class EditorFooterComponent implements OnInit {
  private readonly editorInMemoryStateService = inject(
    EditorInMemoryStateService,
  );
	private readonly electronApi = getElectronApi()

  /**
   * Keeps track if the system has GIT version control
   */
  public readonly hasGit = signal(false);

  /**
   * Keeps track if the user has opened a document and selected line col and row
   */
  public readonly selectedLines = computed(
    () => this.editorInMemoryStateService.selectedLineAndColumn()
  );

  async ngOnInit() {
    await this.checkIfSystemHasGit();
  }

  private async checkIfSystemHasGit() {}
}
