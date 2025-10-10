import { Component, inject, OnInit } from '@angular/core';
import { ContextService } from '../../app-context/app-context.service';
import { getElectronApi } from '../../../utils';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FileItemComponent } from '../file-item/file-item.component';

@Component({
  selector: 'app-file-explorer',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    FileItemComponent,
  ],
  templateUrl: './file-explorer.component.html',
  styleUrl: './file-explorer.component.css',
})
export class FileExplorerComponent implements OnInit {
  private readonly _context = inject(ContextService);

  ngOnInit(): void {
    this.loadFilesAndFolders();
  }

  /**
   * Contaisn the tree strucutre of the dir read
   */
  readDirObject: ReadDirObject | null = null;

  isLoading = false;
  error: string | null = null;

  async loadFilesAndFolders() {
    this.isLoading = true;
    this.error = null;

    let ctx = this._context.getContext();

    let api = getElectronApi();

    this.readDirObject = await api.readDir(undefined, ctx.directoryFolder, {
      ignoreFolders: ['.git'],
    });

    this.isLoading = false;
  }
}
