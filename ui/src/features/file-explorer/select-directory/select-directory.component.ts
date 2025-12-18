import { Component, inject } from '@angular/core';
import { getElectronApi } from '../../../utils';
import { ContextService } from '../../app-context/app-context.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-select-directory',
  imports: [MatButtonModule],
  templateUrl: './select-directory.component.html',
  styleUrl: './select-directory.component.css',
})
export class SelectDirectoryComponent {
  private readonly appContext = inject(ContextService);
  private readonly api = getElectronApi();

  async openFolder() {
    let res = await this.api.selectFolder();
    if (res.canceled) {
      return;
    }

    this.appContext.selectedDirectoryPath.set(res.filePaths[0]);
  }
}
