import { Component, inject } from '@angular/core';
import { getElectronApi } from '../../../utils';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { ContextService } from '../../app-context/app-context.service';
import { TopBarComponent } from "../../top-bar/top-bar.component";

@Component({
  selector: 'app-home-view',
  imports: [MatButtonModule, TopBarComponent],
  templateUrl: './home-view.component.html',
  styleUrl: './home-view.component.css',
})
export class HomeViewComponent {
  private readonly router = inject(Router);
  private readonly active = inject(ActivatedRoute);
  private readonly _context = inject(ContextService);

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

    let ctx = this._context.getContext()
    ctx.directoryFolder = this.selectedFolderPath
    this._context.setContext(ctx)

    this.router.navigate(['editor'], {
      relativeTo: this.active,
    });
  }
}
