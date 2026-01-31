import { Component, inject } from '@angular/core';
import { ThemeService } from '../../theme.service';
import { cssVar } from '../../type';
import { getElectronApi } from '../../../../../utils';

@Component({
  selector: 'app-change-theme-command',
  imports: [],
  templateUrl: './change-theme-command.component.html',
  styleUrl: './change-theme-command.component.css',
})
export class ChangeThemeCommandComponent {
  private readonly api = getElectronApi();
  private readonly themeService = inject(ThemeService);

  async changeTheme() {
    let result = await this.api.fsApi.selectFile();
    if (!result || result?.canceled) return;

    let filePath = result.filePaths[0];
    if (!filePath) return;

    let content = await this.api.fsApi.readFile(filePath);
    let object = JSON.parse(content) as cssVar[];

    let firstEl = object[0];
    if (!firstEl || !firstEl?.property || !firstEl?.value) {
      console.log('Invalid editor theme');
      return;
    }

    this.themeService.set(object);
  }
}
