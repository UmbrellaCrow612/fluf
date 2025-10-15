import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  OnInit,
  viewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  appendChildrenToNode,
  collapseNodeByPath,
  expandNodeByPath,
  getFileExtension,
  removeCreateNodes,
  removeNodeByPath,
} from '../utils';
import { ContextService } from '../../app-context/app-context.service';
import { getElectronApi } from '../../../utils';

@Component({
  selector: 'app-file-explorer-item',
  imports: [MatIconModule],
  templateUrl: './file-explorer-item.component.html',
  styleUrl: './file-explorer-item.component.css',
})
export class FileExplorerItemComponent implements OnInit, AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly appContext = inject(ContextService);
  private readonly api = getElectronApi();

  /**
   * The specific file to render as a file tree item
   */
  fileNode = input.required<fileNode>();

  /**
   * The depth it is in the tree structure
   */
  depth = input.required<number>();

  /**
   * Indicates if the item is clicked on show focus state either if the current file is shown
   * as the current edit file or if it is just a folder clicked in explorer
   */
  isFocused = false;

  getFileExt = getFileExtension;

  /**
   * Input rendered when making a file
   */
  createInput = viewChild<ElementRef<HTMLInputElement>>('create_input');

  ngOnInit(): void {
    this.isFocused =
      this.appContext.getSnapshot().fileExplorerActiveFileOrFolder?.path ===
      this.fileNode().path;

    this.appContext.autoSub(
      'fileExplorerActiveFileOrFolder',
      (ctx) => {
        this.isFocused =
          ctx.fileExplorerActiveFileOrFolder?.path === this.fileNode().path;
      },
      this.destroyRef
    );
  }

  ngAfterViewInit(): void {
    if (this.createInput()) {
      this.createInput()?.nativeElement.focus();
    }
  }

  onCreateInputBlur() {
    let nodes = this.appContext.getSnapshot().directoryFileNodes;
    removeCreateNodes(nodes!);

    this.appContext.update('isCreateFileOrFolderActive', false);
    this.appContext.update('directoryFileNodes', nodes);
  }

  /**
   * Runs when a file explorer item is clicked
   */
  async itemClicked(event: Event) {
    event.preventDefault();

    if (!this.fileNode().isDirectory) {
      this.appContext.update('fileExplorerActiveFileOrFolder', this.fileNode());
      return;
    }

    let previousNodes = this.appContext.getSnapshot().directoryFileNodes;

    if (this.fileNode().expanded) {
      collapseNodeByPath(previousNodes!, this.fileNode().path);
      this.appContext.update('fileExplorerActiveFileOrFolder', this.fileNode());
      this.appContext.update('directoryFileNodes', previousNodes);
      return;
    }

    if (!this.fileNode().expanded && this.fileNode().children.length > 0) {
      expandNodeByPath(previousNodes!, this.fileNode().path!);
      this.appContext.update('fileExplorerActiveFileOrFolder', this.fileNode());
      this.appContext.update('directoryFileNodes', previousNodes);
      return;
    }

    let newChildrenNodes = await this.api.readDir(
      undefined,
      this.fileNode().path
    );

    appendChildrenToNode(
      previousNodes!,
      this.fileNode().path,
      newChildrenNodes
    );

    this.appContext.update('fileExplorerActiveFileOrFolder', this.fileNode());
    this.appContext.update('directoryFileNodes', previousNodes);
  }
}
