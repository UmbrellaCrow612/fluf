import { Component, inject, OnInit } from '@angular/core';
import { getElectronApi } from '../../../../utils';
import { ApplicationContextMenuService } from '../../../../app/context-menu/application-context-menu.service';
import { fileNode } from '../../../../gen/type';

@Component({
  selector: 'app-image-editor-context-menu',
  imports: [],
  templateUrl: './image-editor-context-menu.component.html',
  styleUrl: './image-editor-context-menu.component.css',
})
export class ImageEditorContextMenuComponent implements OnInit {
  private readonly api = getElectronApi();
  private readonly applicationContextMenuService = inject(
    ApplicationContextMenuService,
  );

  private data =
    this.applicationContextMenuService.getContextMenuData() as fileNode;

  error: string | null = null;

  ngOnInit(): void {
    this.error = null;

    if (!this.data) {
      this.error = 'Data invalid';
      return;
    }

    if (!this.data?.path) {
      this.error = 'Data invalid';
      return;
    }
  }

  async copyImgToClipBoard() {
    if (!this.data) {
      this.error = 'Data invalid';
      return;
    }

    console.log(this.data)
    let suc = await this.api.clipboardApi.writeImage(this.data.path);
    if (!suc) {
      this.error = 'Failed to copy image';
    } else {
      this.applicationContextMenuService.close();
    }
  }
}
