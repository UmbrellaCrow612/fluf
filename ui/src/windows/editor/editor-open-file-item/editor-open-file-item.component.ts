import { Component, computed, inject, input, Signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EditorContextService } from '../editor-context/editor-context.service';
import { fileNode } from '../../../gen/type';
import { MatTooltipModule } from '@angular/material/tooltip';
import { removeNodeIfExists } from '../core/file-node-helpers';
import { CoreEditorService } from '../core/services/core-editor.service';

@Component({
  selector: 'app-editor-open-file-item',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './editor-open-file-item.component.html',
  styleUrl: './editor-open-file-item.component.css',
})
export class EditorOpenFileItemComponent {
  private readonly editorContextService = inject(EditorContextService);
  private readonly coreEditorService = inject(CoreEditorService);

  /**
   * Input file node to render for the given item
   */
  public fileNode = input.required<fileNode>();

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
    removeNodeIfExists(openfiles, this.fileNode());

    this.editorContextService.openFiles.set(structuredClone(openfiles));

    let nextAvNode: fileNode | null = openfiles[0];
    if (nextAvNode) {
      this.coreEditorService.OpenFileNodeInEditor(nextAvNode);
    }
  }

  /**
   * Selects the given tab item node as the new active
   */
  public selectFileTabItem(event: Event) {
    this.coreEditorService.OpenFileNodeInEditor(this.fileNode());
  }
}
