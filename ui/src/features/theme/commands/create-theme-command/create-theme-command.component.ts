import { Component } from '@angular/core';
import { cssVariables } from '../../../../gen/cssVars';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-theme-command',
  imports: [FormsModule],
  templateUrl: './create-theme-command.component.html',
  styleUrl: './create-theme-command.component.css',
})
export class CreateThemeCommandComponent {
  /**
   * Represents a given css variable property and it's value mapped from cssVariables
   */
  cssVars: { property: string; value: string }[] = [];

  constructor() {
    this.cssVars = Object.entries(cssVariables).map(([property, value]) => ({
      property,
      value,
    }));
  }

  saveTheme() {
    // call save to explorer api to promt user to name it and save it somehwre then we can load it later
  }
}
