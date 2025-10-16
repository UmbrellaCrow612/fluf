import {
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  viewChild,
} from '@angular/core';
import { ContextService } from '../../app-context/app-context.service';
import { getElectronApi } from '../../../utils';

@Component({
  selector: 'app-file-explorer-context-menu',
  imports: [],
  templateUrl: './file-explorer-context-menu.component.html',
  styleUrl: './file-explorer-context-menu.component.css',
})
export class FileExplorerContextMenuComponent implements OnInit, OnDestroy {
  private readonly appContext = inject(ContextService);
  private readonly dialogRef =
    viewChild<ElementRef<HTMLDialogElement>>('dialog');
  private readonly api = getElectronApi();

  fileNode: fileNode | null = null;
  error: string | null = null;
  operationError: string | null = null;

  private dialogCloseListener: (() => void) | null = null;
  private backdropClickListener: ((event: MouseEvent) => void) | null = null;

  ngOnInit(): void {
    const ctx = this.appContext.getSnapshot();

    this.fileNode = ctx.fileExplorerContextMenufileNode;
    const clickPos = ctx.fileExplorerContextMenuClickPosition;

    if (!this.fileNode) {
      this.error = 'File node not passed';
      return;
    }

    const dialog = this.dialogRef()?.nativeElement;
    if (!dialog) return;

    // Position the dialog before showing it
    if (clickPos) {
      const { x, y } = clickPos;
      dialog.style.position = 'fixed';
      dialog.style.left = `${x}px`;
      dialog.style.top = `${y}px`;
      dialog.style.margin = '0';
      dialog.style.padding = '0';
    }

    this.dialogCloseListener = () => this.onDialogClosed();
    dialog.addEventListener('close', this.dialogCloseListener);

    this.backdropClickListener = (event: MouseEvent) => {
      if (event.target === dialog) {
        dialog.close();
      }
    };
    dialog.addEventListener('click', this.backdropClickListener);

    dialog.showModal();
  }

  closeDialog() {
    this.dialogRef()?.nativeElement.close();
  }

  async deleteFileOrFolder() {
    this.operationError = null;

    if (this.fileNode?.isDirectory) {
      let suc = await this.api.deleteDirectory(undefined, this.fileNode.path);
      if (suc) {
        this.appContext.update('refreshDirectoryFolderNodes', true);
        this.closeDialog();
      } else {
        this.operationError = 'Failed to delete folder';
      }
    }

    if (!this.fileNode?.isDirectory && this.fileNode) {
      let suc = await this.api.deleteFile(undefined, this.fileNode.path);
      if (suc) {
        this.appContext.update('refreshDirectoryFolderNodes', true);
        this.closeDialog();
      } else {
        this.operationError = 'Failed to delete file';
      }
    }
  }

  private onDialogClosed() {
    this.appContext.update('fileExplorerContextMenuClickPosition', null);
    this.appContext.update('fileExplorerContextMenufileNode', null);
    this.appContext.update('displayFileEplorerContextMenu', false);
  }

  ngOnDestroy(): void {
    const dialog = this.dialogRef()?.nativeElement;
    if (!dialog) return;

    if (this.dialogCloseListener) {
      dialog.removeEventListener('close', this.dialogCloseListener);
      this.dialogCloseListener = null;
    }

    if (this.backdropClickListener) {
      dialog.removeEventListener('click', this.backdropClickListener);
      this.backdropClickListener = null;
    }
  }
}
