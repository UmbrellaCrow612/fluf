import { Component, inject } from '@angular/core';
import { getElectronApi } from '../../../utils';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-home-view',
  imports: [MatButtonModule],
  templateUrl: './home-view.component.html',
  styleUrl: './home-view.component.css',
})
export class HomeViewComponent {
  private readonly router = inject(Router);
  private readonly active = inject(ActivatedRoute);

  isOpeningFolder = false;
  selectedFolderPath: string | null = null;
  /**
   * Runs when a user trys to open a folder / directory into the editor
   */
  async openFolderInEditor() {
    this.isOpeningFolder = true;
    this.selectedFolderPath = null;

    let api = getElectronApi();
    let result = await api.selectFolder();
    if (result.canceled) {
      this.isOpeningFolder = false;
      return;
    }
    this.selectedFolderPath = result.filePaths[0];
    this.isOpeningFolder = false;
  }
}
