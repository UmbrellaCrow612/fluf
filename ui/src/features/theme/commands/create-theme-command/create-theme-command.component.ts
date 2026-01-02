import { Component } from '@angular/core';
import { cssVariables } from '../../../../gen/cssVars';
import { FormsModule } from '@angular/forms';
import { getElectronApi } from '../../../../utils';
import { cssVar } from '../../type';

@Component({
  selector: 'app-create-theme-command',
  imports: [FormsModule],
  templateUrl: './create-theme-command.component.html',
  styleUrl: './create-theme-command.component.css',
})
export class CreateThemeCommandComponent {
  private readonly api = getElectronApi();

  /**
   * Represents a given css variable property and it's value mapped from cssVariables
   */
  cssVars: cssVar[] = [];

  constructor() {
    this.cssVars = Object.entries(cssVariables).map(([property, value]) => ({
      property,
      value,
    }));
  }

  async saveTheme() {
    await this.api.fsApi.saveTo(JSON.stringify(this.cssVars), {
      filters: [{ extensions: ['json'], name: 'json' }],
    });
  }
}
