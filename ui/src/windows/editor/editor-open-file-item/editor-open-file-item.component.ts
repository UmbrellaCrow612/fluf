import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
  Signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EditorContextService } from '../editor-context/editor-context.service';
import { fileNode } from '../../../gen/type';
import { MatTooltipModule } from '@angular/material/tooltip';
import { removeFileNodeIfExists } from '../core/file-node-helpers';
import { EditorFileNodeManagerService } from '../core/services/editor-file-manager.service';

@Component({
  selector: 'app-editor-open-file-item',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './editor-open-file-item.component.html',
  styleUrl: './editor-open-file-item.component.css',
})
export class EditorOpenFileItemComponent implements OnInit {
  private readonly editorContextService = inject(EditorContextService);
  private readonly editorFileNodeManagerService = inject(EditorFileNodeManagerService);

  ngOnInit(): void {
    this.openFileTooltip.set(this.fileNode().path);
  }

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
  public tooltTipDelayInMs = 750

  /**
   * Keep track if the given file tab is the one open / active
   */
  public isActive: Signal<boolean> = computed(
    () =>
      this.editorContextService.currentOpenFileInEditor()?.path ===
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
  public closeFileTabItem(event: Event) {
    event.stopPropagation();

    let openfiles = this.editorContextService.openFiles() ?? [];
    removeFileNodeIfExists(openfiles, this.fileNode());

    this.editorContextService.openFiles.set(structuredClone(openfiles));

    let nextAvNode: fileNode | null = openfiles[0];
    if (nextAvNode) {
      this.editorFileNodeManagerService.openFileNodeInEditor(nextAvNode);
    }
  }

  /**
   * Selects the given tab item node as the new active
   */
  public selectFileTabItem(event: Event) {
    this.editorFileNodeManagerService.openFileNodeInEditor(this.fileNode());
  }
}
