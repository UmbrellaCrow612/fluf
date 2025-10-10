import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { getElectronApi } from '../../utils';

@Component({
  selector: 'app-top-bar',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.css',
})
export class TopBarComponent {
  /**
   * Minimizes screen window
   */
  minimize() {
    let api = getElectronApi();

    api.minimize();
  }

  /**
   * Maximizes screen window
   */
  maximize() {
    let api = getElectronApi();

    api.maximize();
  }

  /**
   * Closes screen window
   */
  close() {
    let api = getElectronApi();

    api.close();
  }
}
