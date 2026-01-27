import { Component, computed, inject } from '@angular/core';
import { FileXContextService } from '../file-x-context/file-x-context.service';

@Component({
  selector: 'app-file-x-tabs',
  imports: [],
  templateUrl: './file-x-tabs.component.html',
  styleUrl: './file-x-tabs.component.css',
})
export class FileXTabsComponent {
  private readonly ctx = inject(FileXContextService);

  tabs = computed(() => this.ctx.tabs());
  activeDir = computed(() => this.ctx.currentActiveDirectoryTab());
}
