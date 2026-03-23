import { Component, input, signal } from '@angular/core';
import { fileNode } from '../../../gen/type';
import { useEffect } from '../../../lib/useEffect';
import { getElectronApi } from '../../../shared/electron';

/**
 * Displays a bread crumb of files and folders from the given path file path
 */
@Component({
  selector: 'app-editor-path-breadcrumb-bar',
  imports: [],
  templateUrl: './editor-path-breadcrumb-bar.component.html',
  styleUrl: './editor-path-breadcrumb-bar.component.css',
})
export class EditorPathBreadcrumbBarComponent {
  private readonly electronApi = getElectronApi();

  /**
   * The file in which you wanrt to show a breadcrumb for
   */
  public readonly fileNode = input.required<fileNode>();

  /**
   * Holds loading state
   */
  public readonly isLoading = signal(false);

  /**
   * Holds loading state
   */
  public readonly error = signal<string | null>(null);

  /**
   * Holds a list of file nodes of each segment anchestor of the main path
   */
  public readonly segmentNodes = signal<fileNode[]>([]);

  constructor() {
    useEffect(
      async (_, node) => {
        await this.display(node);
      },
      [this.fileNode],
    );
  }

  /**
   * Displays the breadcrumb for the given node
   * @param node The file node
   */
  private async display(node: fileNode) {
    this.isLoading.set(true);
    this.error.set(null);
    this.segmentNodes.set([])

    try {
      const nodes: fileNode[] = [];
      const segments = await this.electronApi.pathApi.buildPathSegments(
        node.path,
      );

      for (const seg of segments) {
        nodes.push(await this.electronApi.fsApi.getNode(seg));
      }

      this.segmentNodes.set(nodes)
    } catch (error: any) {
      this.error.set(`Failed to load breadcrumb ${error?.message}`);
      console.error('Failed to load breadcrumb ', error);
    } finally {
      this.isLoading.set(false);
    }
  }
}
