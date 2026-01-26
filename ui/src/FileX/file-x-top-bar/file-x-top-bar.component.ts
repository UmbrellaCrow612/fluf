import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { getElectronApi } from '../../utils';

@Component({
  selector: 'app-file-x-top-bar',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './file-x-top-bar.component.html',
  styleUrl: './file-x-top-bar.component.css',
})
export class FileXTopBarComponent {
  private readonly electronApi = getElectronApi();
  /**
   * Minizes `this` window
   */
  minimize() {
    this.electronApi.chromeWindowApi.minimize();
  }

  /**
   * Used to close `this` window
   */
  close() {
    this.electronApi.chromeWindowApi.close();
  }

  /**
   * Either maximizes the `this` window if cropped or restore / full screen it
   */
  restoreOrMaximize() {
    // todo add
  }
}
