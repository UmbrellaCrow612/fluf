import { Component, computed, inject, OnInit, Signal } from '@angular/core';
import { EditorMainContentManagerComponent } from '../editor-main-content-manager/editor-main-content-manager.component';
import { EditorSidebarComponent } from '../editor-sidebar/editor-sidebar.component';
import { EditorContextService } from '../editor-context/editor-context.service';
import { ResizerTwo } from 'umbr-resizer-two';
import { NgComponentOutlet } from '@angular/common';

/**
 * Handles rendering the main central bit of the editor this contains side bar, visual editor and other stuff
 */
@Component({
  selector: 'app-editor-main-content',
  imports: [EditorMainContentManagerComponent, EditorSidebarComponent, NgComponentOutlet],
  templateUrl: './editor-main-content.component.html',
  styleUrl: './editor-main-content.component.css',
})
export class EditorMainContentComponent implements OnInit {
  private readonly editorContextService = inject(EditorContextService);

  private resizer: ResizerTwo | null = null;

  ngOnInit(): void {
    let mainContentContainerElement: HTMLDivElement | null =
      document.getElementById(
        'editor_main_content_wrapper',
      ) as HTMLDivElement | null;
    if (!mainContentContainerElement) {
      throw new Error('editor_main_content_container not found');
    }

    if (this.resizer) {
      this.resizer.dispose();
    }

    this.resizer = new ResizerTwo({
      container: mainContentContainerElement,
      direction: 'horizontal',
      handleStyles: {
        width: '6px',
        background: '--bg-primary',
        boxShadow: '--shadow-md',
        cursor: 'col-resize',
      },
      initalFlex: {
        firstChild: 1,
        secondChild: 1,
      },
      minFlex: {
        firstChild: 0.5,
        secondChild: 0.5,
      },
    });
  }

  /**
   * Determins if the side bar component should be rendered if a specific component to render is present
   */
  public shouldRenderSideBarComponent: Signal<boolean> = computed(
    () => this.editorContextService.sideBarActiveElement() !== null,
  );
}
