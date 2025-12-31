import { Component, inject } from '@angular/core';
import { ThemeService } from '../../theme/theme.service';
import { cssVariables } from '../../../gen/cssVars';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-set-theme-command',
  imports: [CommonModule, FormsModule],
  templateUrl: './set-theme-command.component.html',
  styleUrl: './set-theme-command.component.css',
})
export class SetThemeCommandComponent {
  private readonly themeService = inject(ThemeService);

  variableEntries: Array<{ key: string; value: string }> = [];

  constructor() {
    this.variableEntries = Object.entries(cssVariables).map(([key, value]) => ({
      key,
      value,
    }));
  }

  onVariableChange(key: string, value: string): void {
    // Value is already updated via two-way binding
    console.log(`Variable ${key} changed to:`, value);
  }

  onSave(): void {
    const updatedVariables = this.variableEntries.reduce((acc, entry) => {
      acc[entry.key] = entry.value;
      return acc;
    }, {} as Record<string, string>);

    console.log('Saving CSS variables:', updatedVariables);

    // Apply the variables globally using ThemeService
    this.themeService.set(updatedVariables);

    console.log('CSS variables applied to :root');
  }
}
