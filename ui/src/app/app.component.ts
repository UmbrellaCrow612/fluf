import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { getElectronApi } from '../utils';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  selectedFolder: string | null = null;

  async openFolderDialog() {
    try {
      let api = getElectronApi()
      const result = await api.selectFolder();
      if (!result.canceled && result.filePaths.length > 0) {
        this.selectedFolder = result.filePaths[0];
      } else {
        this.selectedFolder = 'No folder selected';
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
      this.selectedFolder = 'An error occurred.';
    }
  }
}
