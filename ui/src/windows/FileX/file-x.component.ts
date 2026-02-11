import { Component, OnInit } from '@angular/core';
import { FileXTopBarComponent } from './file-x-top-bar/file-x-top-bar.component';
import { FileXToolBarComponent } from './file-x-tool-bar/file-x-tool-bar.component';
import { FileXQuickAccessFoldersComponent } from './file-x-quick-access-folders/file-x-quick-access-folders.component';
import { FileXDirectoryContentComponent } from './file-x-directory-content/file-x-directory-content.component';
import { FileXTabsComponent } from './file-x-tabs/file-x-tabs.component';
import { FileXActionsComponent } from './file-x-actions/file-x-actions.component';
import { FileXBottomComponent } from './file-x-bottom/file-x-bottom.component';
import { getElectronApi } from '../../utils';
import { OpenFileInFileX } from './utils';

/**
 * Our custom built file explorer application similar to windows file explorer built inside the IDE to offer fast file exploration.
 */
@Component({
  selector: 'app-file-x',
  imports: [
    FileXTopBarComponent,
    FileXToolBarComponent,
    FileXQuickAccessFoldersComponent,
    FileXDirectoryContentComponent,
    FileXTabsComponent,
    FileXActionsComponent,
    FileXBottomComponent,
  ],
  templateUrl: './file-x.component.html',
  styleUrl: './file-x.component.css',
})
export class FileXComponent implements OnInit {
  private readonly api = getElectronApi();

  ngOnInit(): void {
    this.api.commandServer.on('open', async (window, fp) => {
      if(window == "fx"){
        let asNode = await this.api.fsApi.getNode(fp)
        OpenFileInFileX(asNode)
      }
    });
  }
}
