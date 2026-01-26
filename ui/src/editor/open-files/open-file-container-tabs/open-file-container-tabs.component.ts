import { Component, computed, DestroyRef, inject, OnInit } from '@angular/core';
import { FileTabItemComponent } from './file-tab-item/file-tab-item.component';
import { EditorContextService } from '../../app-context/editor-context.service';

@Component({
  selector: 'app-open-file-container-tabs',
  imports: [FileTabItemComponent],
  templateUrl: './open-file-container-tabs.component.html',
  styleUrl: './open-file-container-tabs.component.css',
})
export class OpenFileContainerTabsComponent {
  private readonly appContext = inject(EditorContextService);

  tabs = computed(() => this.appContext.openFiles());
}
