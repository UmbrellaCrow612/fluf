import { Component, inject } from '@angular/core';
import { InMemoryContextService } from '../../app-context/app-in-memory-context.service';

@Component({
  selector: 'app-file-explorer-file-node-context-menu',
  imports: [],
  templateUrl: './file-explorer-file-node-context-menu.component.html',
  styleUrl: './file-explorer-file-node-context-menu.component.css',
})
export class FileExplorerFileNodeContextMenuComponent {
  private readonly inMemoryContextService = inject(InMemoryContextService)
  private readonly snapshot = this.inMemoryContextService.getSnapShot();

  
}
