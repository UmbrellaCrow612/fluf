import {
  Component,
  computed,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
  Signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EditorStateService } from '../core/state/editor-state.service';
import { fileNode, voidCallback } from '../../../gen/type';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EditorFileOpenerService } from '../core/services/editor-file-opener.service';
import { removeFileNodeIfExists } from '../../../shared/file-node-helpers';
import { ApplicationConfirmationService } from '../../../shared/services/application-confirmation.service';
import { EditorFileStateService } from '../core/services/editor-file-state.service';
import { EditorSessionStateService } from '../core/services/editor-session-state.service';

@Component({
  selector: 'app-editor-open-file-item',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './editor-open-file-item.component.html',
  styleUrl: './editor-open-file-item.component.css',
})
export class EditorOpenFileItemComponent implements OnInit, OnDestroy {
  private readonly editorStateService = inject(EditorStateService);
  private readonly editorFileOpenerService = inject(EditorFileOpenerService);
  private readonly applicationConfirmationService = inject(
    ApplicationConfirmationService,
  );
  private readonly editorFileStateService = inject(EditorFileStateService);
  private readonly editorSessionStateService = inject(EditorSessionStateService)

  private unsub: voidCallback | null = null;

  ngOnInit() {
    this.openFileTooltip.set(this.fileNode().path);

    this.unsub = this.editorFileStateService.onDirtyChange(
      this.fileNode().path,
      (isDirty) => {
        this.isDirty.set(isDirty);
      },
    );
  }

  ngOnDestroy() {
    this.unsub?.();
  }

  /**
   * TODO: on close check if there are unsaved changes for file and not auto save on then display warning beofre closing and restting state
   * if press save apply changes to a string then save them to the file
   */

  /**
   * Input file node to render for the given item
   */
  public fileNode = input.required<fileNode>();

  /**
   * Holds the tooltip for hover information
   */
  public openFileTooltip = signal('');

  /**
   * How long it takes for the parent tooltip to show
   */
  public tooltTipDelayInMs = 750;

  /**
   * Keeps track if the current file is dirty
   */
  public readonly isDirty = signal(false);

  /**
   * Keep track if the given file tab is the one open / active
   */
  public isActive: Signal<boolean> = computed(
    () =>
      this.editorStateService.currentOpenFileInEditor()?.path ===
      this.fileNode().path,
  );

  /**
   * The icon name displayed for the given file based on it's extension computed once
   */
  public fileIcon: Signal<string> = computed(() => {
    return (
      this.fileIconListMapNames.find(
        (x) => x.fileExtension == this.fileNode().extension,
      )?.iconName ?? 'description'
    );
  });

  private fileIconListMapNames: { fileExtension: string; iconName: string }[] =
    [
      {
        fileExtension: '.html',
        iconName: 'html',
      },
      {
        fileExtension: '.css',
        iconName: 'css',
      },
      {
        fileExtension: '.js',
        iconName: 'javascript',
      },
    ];

  /**
   * Removes the given tab item from the open files and put's the next aviavke item as active
   */
  public async closeFileTabItem(event: Event) {
    event.stopPropagation();

    if (this.isDirty()) {
      const confirmed = await this.applicationConfirmationService.request(
        'This file has unsaved changes are you sure you want to close it',
      );
      if (!confirmed) {
        return;
      }
    }

    this.editorFileStateService.reset(this.fileNode().path);
    this.editorSessionStateService.removeCache(this.fileNode().path)

    let openfiles = this.editorStateService.openFiles() ?? [];
    removeFileNodeIfExists(openfiles, this.fileNode());

    this.editorStateService.openFiles.set(structuredClone(openfiles));

    if (this.isActive()) {
      let nextAvNode: fileNode | null = openfiles[0];
      if (nextAvNode) {
        this.editorFileOpenerService.openFileNodeInEditor(nextAvNode);
      }
    }
  }

  /**
   * Selects the given tab item node as the new active
   */
  public selectFileTabItem(event: Event) {
    this.editorFileOpenerService.openFileNodeInEditor(this.fileNode());
  }
}
